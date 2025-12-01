import { Action, Bot, Signal } from "@prisma/client";
import {
    getSymbolConstraints,
    getMarginBalance,
    getMaxBorrowable,
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
        balance: number; // Available balance (or max borrowable for shorts)
    };
    error?: string;
}

export interface MarginValidationContext {
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
 * Robust validation for Margin Trading (Cross Margin)
 * Fetches fresh constraints, balance, and borrow limits.
 */
export async function validateMarginSignal(
    context: MarginValidationContext
): Promise<ValidationResult> {
    const { bot, signal, currentPrice } = context;
    const config: BinanceConfig = {
        apiKey: bot.exchange.apiKey,
        apiSecret: bot.exchange.apiSecret,
    };

    // 1. Basic Checks
    if (!bot.isActive) return { success: false, error: "Bot is not active" };
    if (!bot.exchange.isActive) return { success: false, error: "Exchange is not active" };
    if (bot.accountType !== "MARGIN") return { success: false, error: "Bot is not configured for MARGIN trading" };

    // 2. Determine Action & Assets
    const isEnter = signal.action === Action.ENTER_LONG || signal.action === Action.ENTER_SHORT;
    const isLong = signal.action === Action.ENTER_LONG || signal.action === Action.EXIT_LONG;
    const { baseAsset, quoteAsset } = extractAssets(signal.symbol);

    try {
        // 3. Fetch Data in Parallel
        // We need constraints and potentially max borrow or balance depending on action
        const constraintsPromise = getSymbolConstraints(config, signal.symbol);

        // Determine what balance/limit to fetch
        let balancePromise;
        let maxBorrowPromise;

        if (signal.action === Action.ENTER_LONG) {
            // Buying with USDT (borrowing if needed) -> Check Buying Power (USDT Balance + Max Borrow)
            // Ideally just check USDT balance if we want to use own funds first, 
            // but for "Margin Buy" usually we want to know total capacity.
            // For simplicity/speed, we'll check USDT Balance. 
            // If user wants to leverage, they should have "borrowed" or we use "sideEffectType: MARGIN_BUY" which auto-borrows.
            // To be safe: Check USDT Balance. If insufficient, check Max Borrowable USDT.
            balancePromise = getMarginBalance(config, quoteAsset);
            maxBorrowPromise = getMaxBorrowable(config, quoteAsset);
        } else if (signal.action === Action.ENTER_SHORT) {
            // Selling BTC (borrowed) -> Check Max Borrowable BTC
            balancePromise = getMarginBalance(config, baseAsset); // To see if we already have some
            maxBorrowPromise = getMaxBorrowable(config, baseAsset);
        } else if (signal.action === Action.EXIT_LONG) {
            // Selling BTC -> Check BTC Balance
            balancePromise = getMarginBalance(config, baseAsset);
        } else if (signal.action === Action.EXIT_SHORT) {
            // Buying BTC to repay -> Check USDT Balance
            balancePromise = getMarginBalance(config, quoteAsset);
        }

        const [constraints, balance, maxBorrow] = await Promise.all([
            constraintsPromise,
            balancePromise,
            maxBorrowPromise
        ]);

        if (!constraints) {
            return { success: false, error: `Failed to fetch trading constraints for ${signal.symbol}` };
        }

        // 4. Calculate Target Quantity with Leverage
        let targetBaseQty = 0;
        const leverage = bot.leverage || 1;

        if (bot.tradeAmountType === "QUOTE") {
            // tradeAmount is "Your Capital" in USDT
            // Total Position Value = Capital * Leverage
            const totalNotional = bot.tradeAmount * leverage;
            targetBaseQty = totalNotional / currentPrice;
        } else {
            // tradeAmount is "Your Capital" in BTC (Base Asset)
            // Total Position Size = Capital (BTC) * Leverage
            targetBaseQty = bot.tradeAmount * leverage;
        }

        // 5. Validate & Format Quantity
        const formattedBaseQty = formatQuantityToLotSize(targetBaseQty, {
            minQty: constraints.minQty,
            maxQty: constraints.maxQty,
            stepSize: constraints.stepSize,
        });

        if (formattedBaseQty < constraints.minQty) {
            return {
                success: false,
                error: `Calculated quantity ${targetBaseQty.toFixed(8)} is below minimum ${constraints.minQty}`
            };
        }

        const notionalValue = formattedBaseQty * currentPrice;
        if (notionalValue < constraints.minNotional) {
            return {
                success: false,
                error: `Order value ${notionalValue.toFixed(2)} is below minimum notional ${constraints.minNotional}`
            };
        }

        // 6. Validate "Balance" / Capacity
        if (signal.action === Action.ENTER_LONG) {
            // Need Quote Asset (USDT)
            // Available + MaxBorrow (if we assume auto-borrow)
            // For now, let's assume we use available funds + auto-borrow if configured.
            // But to be safe, let's just check if (Available + MaxBorrow) >= Notional
            const totalBuyingPower = (balance?.available || 0) + (maxBorrow || 0);

            if (totalBuyingPower < notionalValue) {
                return {
                    success: false,
                    error: `Insufficient buying power. Need ${notionalValue.toFixed(2)} ${quoteAsset}, have ${balance?.available.toFixed(2)} + borrowable ${maxBorrow?.toFixed(2)}`,
                };
            }

            // Pass available balance as the "balance" for executor to decide logic
            return { success: true, data: { formattedQuantity: formattedBaseQty, constraints, currentPrice, balance: balance?.available || 0 } };

        } else if (signal.action === Action.ENTER_SHORT) {
            // Need Base Asset (BTC) to sell. Since we are entering short, we likely don't have it, so we borrow.
            // Check Max Borrowable BTC
            if ((maxBorrow || 0) < formattedBaseQty) {
                return {
                    success: false,
                    error: `Insufficient borrow limit. Need ${formattedBaseQty} ${baseAsset}, can borrow ${maxBorrow}`,
                };
            }
            return { success: true, data: { formattedQuantity: formattedBaseQty, constraints, currentPrice, balance: maxBorrow || 0 } };

        } else if (signal.action === Action.EXIT_LONG) {
            // Selling BTC we own. Check Available BTC.
            const available = balance?.available || 0;
            if (available < formattedBaseQty) {
                // Optimization: If close to available, sell all
                if (Math.abs(available - formattedBaseQty) < constraints.stepSize * 2) {
                    const safeAvailable = formatQuantityToLotSize(available, {
                        minQty: constraints.minQty,
                        maxQty: constraints.maxQty,
                        stepSize: constraints.stepSize,
                    });
                    if (safeAvailable >= constraints.minQty) {
                        // Check MIN_NOTIONAL for adjusted qty
                        if (safeAvailable * currentPrice < constraints.minNotional) {
                            return { success: false, error: `Remaining balance too small for MIN_NOTIONAL` };
                        }
                        return { success: true, data: { formattedQuantity: safeAvailable, constraints, currentPrice, balance: available } };
                    }
                }
                return { success: false, error: `Insufficient ${baseAsset} to sell. Need ${formattedBaseQty}, have ${available}` };
            }
            return { success: true, data: { formattedQuantity: formattedBaseQty, constraints, currentPrice, balance: available } };

        } else if (signal.action === Action.EXIT_SHORT) {
            // Buying BTC to repay. Need USDT.
            const available = balance?.available || 0;
            if (available < notionalValue) {
                // Optimization: Reduce if close
                // ... (similar to spot buy optimization)
                return { success: false, error: `Insufficient ${quoteAsset} to buy back. Need ${notionalValue.toFixed(2)}, have ${available.toFixed(2)}` };
            }
            return { success: true, data: { formattedQuantity: formattedBaseQty, constraints, currentPrice, balance: available } };
        }

        return { success: false, error: "Invalid action" };

    } catch (error) {
        console.error("Margin Validation error:", error);
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
    return { baseAsset: symbol.slice(0, -4), quoteAsset: symbol.slice(-4) };
}
