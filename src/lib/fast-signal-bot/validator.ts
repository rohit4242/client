import { Action, Bot, Signal } from "@prisma/client";
import {
    getSymbolConstraints,
    getSpotBalance,
    formatQuantityToLotSize,
    TradingConstraints,
} from "../signal-bot/exchange-info-utils";
import { BinanceConfig } from "../services/exchange/types";

export interface ValidationResult {
    success: boolean;
    data?: {
        formattedQuantity: number;
        constraints: TradingConstraints;
        currentPrice: number;
        balance: number;
    };
    error?: string;
}

export interface SpotValidationContext {
    bot: Bot & {
        exchange: {
            apiKey: string;
            apiSecret: string;
            isActive: boolean;
        };
    };
    signal: Signal;
    currentPrice: number;
}

/**
 * Robust validation for Spot Trading
 * Fetches fresh constraints and balance to ensure execution safety.
 */
export async function validateSpotSignal(
    context: SpotValidationContext
): Promise<ValidationResult> {
    const { bot, signal, currentPrice } = context;
    const config: BinanceConfig = {
        apiKey: bot.exchange.apiKey,
        apiSecret: bot.exchange.apiSecret,
    };

    // 1. Basic Checks
    if (!bot.isActive) return { success: false, error: "Bot is not active" };
    if (!bot.exchange.isActive) return { success: false, error: "Exchange is not active" };
    if (bot.accountType !== "SPOT") return { success: false, error: "Bot is not configured for SPOT trading" };

    // 2. Fetch Constraints & Balance in Parallel
    // Determine which asset we need balance for
    // BUY (Enter Long) -> Need Quote Asset (e.g., USDT for BTCUSDT)
    // SELL (Exit Long) -> Need Base Asset (e.g., BTC for BTCUSDT)
    const isBuy = signal.action === Action.ENTER_LONG;
    const { baseAsset, quoteAsset } = extractAssets(signal.symbol);
    const requiredAsset = isBuy ? quoteAsset : baseAsset;

    try {
        const [constraints, balance] = await Promise.all([
            getSymbolConstraints(config, signal.symbol),
            getSpotBalance(config, requiredAsset),
        ]);

        if (!constraints) {
            return { success: false, error: `Failed to fetch trading constraints for ${signal.symbol}` };
        }

        // 3. Calculate Target Quantity
        // If tradeAmountType is QUOTE (e.g. 100 USDT), convert to Base quantity for calculation
        // If tradeAmountType is BASE (e.g. 0.001 BTC), use directly
        let targetBaseQty = 0;

        if (bot.tradeAmountType === "QUOTE") {
            targetBaseQty = bot.tradeAmount / currentPrice;
        } else {
            targetBaseQty = bot.tradeAmount;
        }

        // 4. Validate & Format Quantity against Constraints
        // Ensure it meets LOT_SIZE (minQty, maxQty, stepSize)
        const formattedBaseQty = formatQuantityToLotSize(targetBaseQty, {
            minQty: constraints.minQty,
            maxQty: constraints.maxQty,
            stepSize: constraints.stepSize,
        });

        // Check if formatting pushed it below minQty
        if (formattedBaseQty < constraints.minQty) {
            return {
                success: false,
                error: `Calculated quantity ${targetBaseQty.toFixed(8)} is below minimum ${constraints.minQty}`
            };
        }

        // Check Min Notional (Order Value > 5 USDT usually)
        const notionalValue = formattedBaseQty * currentPrice;
        if (notionalValue < constraints.minNotional) {
            return {
                success: false,
                error: `Order value ${notionalValue.toFixed(2)} is below minimum notional ${constraints.minNotional}`
            };
        }

        // 5. Validate Balance
        if (isBuy) {
            // For BUY, we need enough Quote Asset (e.g. USDT) to cover Notional Value
            // We should add a small buffer (e.g. 0.1%) for fees if not handled elsewhere, 
            // but for now strict check against available
            if (balance.available < notionalValue) {
                return {
                    success: false,
                    error: `Insufficient ${requiredAsset} balance. Need ${notionalValue.toFixed(2)}, have ${balance.available.toFixed(2)}`,
                };
            }
        } else {
            // For SELL, we need enough Base Asset (e.g. BTC)
            // If we are closing a position, we might want to sell "everything we have" if it's close to target,
            // but strictly following bot config:
            if (balance.available < formattedBaseQty) {
                // Optimization: If available is very close to target (within 1 step size), just sell available
                if (Math.abs(balance.available - formattedBaseQty) < constraints.stepSize * 2) {
                    // Use available if it's slightly less but close enough (rounding issues)
                    // But we must re-format available to be safe
                    const safeAvailable = formatQuantityToLotSize(balance.available, {
                        minQty: constraints.minQty,
                        maxQty: constraints.maxQty,
                        stepSize: constraints.stepSize,
                    });

                    // If safe available is still valid
                    if (safeAvailable >= constraints.minQty) {
                        return {
                            success: true,
                            data: {
                                formattedQuantity: safeAvailable,
                                constraints,
                                currentPrice,
                                balance: balance.available,
                            },
                        };
                    }
                }

                return {
                    success: false,
                    error: `Insufficient ${requiredAsset} balance. Need ${formattedBaseQty.toFixed(8)}, have ${balance.available.toFixed(8)}`,
                };
            }
        }

        return {
            success: true,
            data: {
                formattedQuantity: formattedBaseQty,
                constraints,
                currentPrice,
                balance: balance.available,
            },
        };

    } catch (error) {
        console.error("Validation error:", error);
        return { success: false, error: error instanceof Error ? error.message : "Validation failed" };
    }
}

function extractAssets(symbol: string): { baseAsset: string; quoteAsset: string } {
    const quoteAssets = ['USDT', 'BUSD', 'USDC', 'BTC', 'ETH', 'BNB', 'FDUSD'];
    for (const quote of quoteAssets) {
        if (symbol.endsWith(quote)) {
            return { baseAsset: symbol.slice(0, -quote.length), quoteAsset: quote };
        }
    }
    // Fallback
    return { baseAsset: symbol.slice(0, -4), quoteAsset: symbol.slice(-4) };
}
