/**
 * Trading Engine - Validation Layer
 * 
 * Comprehensive validation for all trading requests
 * Checks balance, bot limits, symbol filters, etc.
 */

import type { NormalizedTradingRequest, ValidationResult, ValidationData } from "../types/trading.types";
import {
    getSymbolInfo,
    getSymbolPrice,
    getSpotBalance,
    getMarginAccount,
    getMaxBorrowable,
    getPriceFilter,
    getLotSizeFilter,
    getMinNotionalFilter,
    createSpotClient,
    createMarginClient,
    type SymbolInfo
} from "@/features/binance";
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
        // Create client for market data
        const client = createSpotClient(request.exchange);

        // 1. Get symbol information
        const symbolInfoResult = await getSymbolInfo(client, request.order.symbol);

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
        const priceResult = await getSymbolPrice(client, request.order.symbol);

        if (!priceResult.success || !priceResult.data) {
            errors.push("Failed to fetch current price");
            return { isValid: false, errors };
        }

        const currentPrice = parseFloat(priceResult.data.price);

        // 3. Validate bot limits (if signal)
        if (request.source === "BOT" && request.botId) {
            const botValidation = await validateBotLimits(request.botId, request.order.symbol);
            if (!botValidation.isValid) {
                errors.push(...(botValidation.errors || []));
            }
        }

        // 4. Validate balance
        const balanceValidation = await validateBalance(
            request,
            currentPrice,
            symbolInfo
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
    request: NormalizedTradingRequest,
    currentPrice: number,
    symbolInfo: SymbolInfo
): Promise<{
    isValid: boolean;
    errors?: string[];
    availableBalance?: number;
    maxBorrowable?: number;
}> {
    const errors: string[] = [];
    const { order, exchange } = request;
    const { symbol, accountType, quantity, quoteOrderQty } = order;

    // Determine required balance
    let requiredBalance = 0;
    if (quoteOrderQty) {
        requiredBalance = parseFloat(quoteOrderQty);
    } else if (quantity) {
        requiredBalance = parseFloat(quantity) * currentPrice;
    }

    if (accountType === "SPOT") {
        const client = createSpotClient(exchange);
        const balanceResult = await getSpotBalance(client);

        if (!balanceResult.success || !balanceResult.data) {
            return { isValid: false, errors: [balanceResult.error || "Failed to fetch spot balance"] };
        }

        // Get quote asset from symbol info
        const quoteAsset = symbolInfo.quoteAsset;
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
        const client = createMarginClient(exchange);
        const balanceResult = await getMarginAccount(client);

        if (!balanceResult.success || !balanceResult.data) {
            return { isValid: false, errors: [balanceResult.error || "Failed to fetch margin balance"] };
        }

        // For margin, we also want to know max borrowable for the base asset or quote asset?
        // Usually we check if we can afford the trade with what we have + what we can borrow.
        // For now, keep it simple and return the net BTC value as before, 
        // but we could also get max borrowable for the specific asset.

        const quoteAsset = symbolInfo.quoteAsset;
        const maxBorrowResult = await getMaxBorrowable(client, quoteAsset);
        const maxBorrowable = maxBorrowResult.success ? maxBorrowResult.data?.amount : 0;

        return {
            isValid: true,
            availableBalance: parseFloat(balanceResult.data.totalNetAssetOfBtc),
            maxBorrowable,
        };
    }
}

/**
 * Extract symbol filters from symbol info
 */
function extractSymbolFilters(symbolInfo: SymbolInfo) {
    const priceFilter = getPriceFilter(symbolInfo);
    const lotSizeFilter = getLotSizeFilter(symbolInfo);
    const minNotionalFilter = getMinNotionalFilter(symbolInfo);

    return {
        minPrice: priceFilter?.minPrice || "0",
        maxPrice: priceFilter?.maxPrice || "999999999",
        tickSize: priceFilter?.tickSize || "0.01",
        minQty: lotSizeFilter?.minQty || "0",
        maxQty: lotSizeFilter?.maxQty || "999999999",
        stepSize: lotSizeFilter?.stepSize || "0.00000001",
        minNotional: minNotionalFilter?.minNotional || (minNotionalFilter as any)?.notional || "10",
    };
}
