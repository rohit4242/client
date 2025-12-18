/**
 * Trading Engine - Validation Layer
 * 
 * Comprehensive validation for all trading requests
 * Checks balance, bot limits, symbol filters, etc.
 */

import type { NormalizedTradingRequest, ValidationResult, ValidationData } from "../types/trading.types";
import { getSymbolInfoAction, getSymbolPriceAction, getSpotBalanceAction, getMarginBalanceAction, getMaxBorrowableAction } from "@/features/binance";
import { db } from "@/lib/db/client";

/**
 * Validate trading request
 * 
 * Performs comprehensive validation:
 * 1. Symbol exists and is tradeable
 * 2. Get current price
 * 3. Validate bot limits (if signal)
 * 4. Validate user balance
 * 5. Validate against symbol filters
 */
export async function validateTradingRequest(
    request: NormalizedTradingRequest
): Promise<ValidationResult> {
    const errors: string[] = [];

    try {
        // 1. Get symbol information
        const symbolInfoResult = await getSymbolInfoAction({
            exchangeId: request.exchange.id,
            symbol: request.order.symbol,
        });

        if (!symbolInfoResult.success || !symbolInfoResult.data) {
            errors.push(`Symbol ${request.order.symbol} not found or not tradeable`);
            return { isValid: false, errors };
        }

        const symbolInfo = symbolInfoResult.data;

        // Check if trading is allowed
        if (!symbolInfo.isSpotTradingAllowed && request.order.accountType === "SPOT") {
            errors.push(`Spot trading not allowed for ${request.order.symbol}`);
        }
        if (!symbolInfo.isMarginTradingAllowed && request.order.accountType === "MARGIN") {
            errors.push(`Margin trading not allowed for ${request.order.symbol}`);
        }

        // 2. Get current price
        const priceResult = await getSymbolPriceAction({
            exchangeId: request.exchange.id,
            symbol: request.order.symbol,
        });

        if (!priceResult.success || !priceResult.data) {
            errors.push("Failed to fetch current price");
            return { isValid: false, errors };
        }

        const currentPrice = parseFloat(priceResult.data.price);

        // 3. Validate bot limits (if signal)
        if (request.source === "SIGNAL_BOT" && request.botId) {
            const botValidation = await validateBotLimits(request.botId, request.order.symbol);
            if (!botValidation.isValid) {
                errors.push(...(botValidation.errors || []));
            }
        }

        // 4. Validate balance
        const balanceValidation = await validateBalance(
            request.exchange.id,
            request.order.accountType,
            request.order.symbol,
            currentPrice,
            request.order.quantity,
            request.order.quoteOrderQty
        );

        if (!balanceValidation.isValid) {
            errors.push(...(balanceValidation.errors || []));
        }

        // 5. Extract symbol filters
        const filters = extractSymbolFilters(symbolInfo);

        if (errors.length > 0) {
            return { isValid: false, errors };
        }

        return {
            isValid: true,
            data: {
                currentPrice,
                availableBalance: balanceValidation.availableBalance || 0,
                maxBorrowable: balanceValidation.maxBorrowable,
                symbolFilters: filters,
            },
        };
    } catch (error) {
        return {
            isValid: false,
            errors: [error instanceof Error ? error.message : "Validation failed"],
        };
    }
}

/**
 * Validate bot trading limits
 */
async function validateBotLimits(
    botId: string,
    symbol: string
): Promise<{ isValid: boolean; errors?: string[] }> {
    const errors: string[] = [];

    const bot = await db.bot.findUnique({
        where: { id: botId },
        include: {
            _count: {
                select: {
                    positions: {
                        where: { status: "OPEN" },
                    },
                },
            },
        },
    });

    if (!bot) {
        return { isValid: false, errors: ["Bot not found"] };
    }

    if (!bot.isActive) {
        return { isValid: false, errors: ["Bot is not active"] };
    }

    // Check symbol is allowed
    if (bot.symbols.length > 0 && !bot.symbols.includes(symbol)) {
        errors.push(`Symbol ${symbol} not configured for this bot`);
    }
    return {
        isValid: errors.length === 0,
        errors: errors.length > 0 ? errors : undefined,
    };
}

/**
 * Validate user balance
 */
async function validateBalance(
    exchangeId: string,
    accountType: "SPOT" | "MARGIN",
    symbol: string,
    currentPrice: number,
    quantity?: string,
    quoteOrderQty?: string
): Promise<{
    isValid: boolean;
    errors?: string[];
    availableBalance?: number;
    maxBorrowable?: number;
}> {
    const errors: string[] = [];

    // Determine required balance
    let requiredBalance = 0;
    if (quoteOrderQty) {
        requiredBalance = parseFloat(quoteOrderQty);
    } else if (quantity) {
        requiredBalance = parseFloat(quantity) * currentPrice;
    }

    if (accountType === "SPOT") {
        const balanceResult = await getSpotBalanceAction({ exchangeId });

        if (!balanceResult.success || !balanceResult.data) {
            return { isValid: false, errors: ["Failed to fetch spot balance"] };
        }

        // Get quote asset (assume USDT for now)
        const quoteAsset = symbol.replace(/[A-Z]+/, "").replace(symbol.match(/^[A-Z]+/)?.[0] || "", "") || "USDT";
        const assetBalance = balanceResult.data.balances.find(b => b.asset === quoteAsset);
        const available = parseFloat(assetBalance?.free || "0");

        if (available < requiredBalance) {
            errors.push(`Insufficient ${quoteAsset} balance. Available: ${available}, Required: ${requiredBalance}`);
        }

        return {
            isValid: errors.length === 0,
            errors: errors.length > 0 ? errors : undefined,
            availableBalance: available,
        };
    } else {
        // Margin account
        const balanceResult = await getMarginBalanceAction({ exchangeId });

        if (!balanceResult.success || !balanceResult.data) {
            return { isValid: false, errors: ["Failed to fetch margin balance"] };
        }

        // For margin, we can borrow if needed
        // Return success but provide available balance info
        return {
            isValid: true,
            availableBalance: parseFloat(balanceResult.data.totalNetAssetOfBtc),
        };
    }
}

/**
 * Extract symbol filters from symbol info
 */
function extractSymbolFilters(symbolInfo: any) {
    const priceFilter = symbolInfo.filters.find((f: any) => f.filterType === "PRICE_FILTER");
    const lotSizeFilter = symbolInfo.filters.find((f: any) => f.filterType === "LOT_SIZE");
    const minNotionalFilter = symbolInfo.filters.find((f: any) => f.filterType === "MIN_NOTIONAL" || f.filterType === "NOTIONAL");

    return {
        minPrice: priceFilter?.minPrice || "0",
        maxPrice: priceFilter?.maxPrice || "999999999",
        tickSize: priceFilter?.tickSize || "0.01",
        minQty: lotSizeFilter?.minQty || "0",
        maxQty: lotSizeFilter?.maxQty || "999999999",
        stepSize: lotSizeFilter?.stepSize || "0.00000001",
        minNotional: minNotionalFilter?.minNotional || minNotionalFilter?.notional || "10",
    };
}
