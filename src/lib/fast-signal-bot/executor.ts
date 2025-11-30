import db from "@/db";
import { Action, Bot, Signal } from "@prisma/client";
import { SpotOrderParams, BinanceConfig, BinanceOrderResponse } from "../services/exchange/types";
import { placeSpotOrder } from "../services/exchange/binance-spot";
import { ValidationResult } from "./validator";

export interface ExecutionResult {
    success: boolean;
    orderId?: string;
    positionId?: string;
    message?: string;
    error?: string;
    executionTime?: number;
}

export interface SpotExecutionContext {
    bot: Bot & {
        portfolio: { userId: string };
        exchange: { apiKey: string; apiSecret: string };
    };
    signal: Signal;
    validation: ValidationResult;
}

/**
 * Fast Spot Execution
 * Orchestrates the execution flow: Prepare -> Execute -> DB Update -> Stats
 */
export async function executeSpotTrade(
    context: SpotExecutionContext
): Promise<ExecutionResult> {
    const startTime = Date.now();
    const { bot, signal, validation } = context;

    if (!validation.success || !validation.data) {
        return { success: false, error: validation.error || "Validation failed" };
    }

    try {
        // 1. Prepare Params
        const params = prepareSpotOrderParams(bot, signal, validation.data);
        const config: BinanceConfig = {
            apiKey: bot.exchange.apiKey,
            apiSecret: bot.exchange.apiSecret,
        };

        console.log(`[FastSpot] Executing ${params.side} ${params.symbol} Qty:${params.quantity} Type:${params.type}`);

        // 2. Execute on Binance
        const binanceData = await executeBinanceOrder(config, params);

        // 3. Handle DB Updates
        const result = await handleDbUpdates(bot, signal, binanceData, params);

        // 4. Update Stats Async
        updateStatsAsync(bot.id, bot.portfolio.userId);

        return {
            success: true,
            orderId: result.orderId,
            positionId: result.positionId,
            message: `Successfully executed ${params.side} ${params.symbol}`,
            executionTime: Date.now() - startTime,
        };

    } catch (error) {
        console.error("[FastSpot] Execution error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Execution failed",
            executionTime: Date.now() - startTime,
        };
    }
}

/**
 * Prepare Binance Spot Order Parameters
 */
export function prepareSpotOrderParams(
    bot: Bot,
    signal: Signal,
    validationData: NonNullable<ValidationResult["data"]>
): SpotOrderParams {
    const side = signal.action === Action.ENTER_LONG ? "BUY" : "SELL";
    const type = bot.orderType === "Limit" ? "LIMIT" : "MARKET";

    const params: SpotOrderParams = {
        symbol: signal.symbol,
        side,
        type,
        quantity: validationData.formattedQuantity.toFixed(8),
    };

    if (type === "LIMIT") {
        params.price = validationData.currentPrice.toFixed(2); // TODO: Use proper precision from constraints
        params.timeInForce = "GTC";
    }

    return params;
}

/**
 * Execute Order on Binance
 */
export async function executeBinanceOrder(
    config: BinanceConfig,
    params: SpotOrderParams
): Promise<BinanceOrderResponse> {
    const binanceResult = await placeSpotOrder(config, params);

    if (!binanceResult.success || !binanceResult.data) {
        throw new Error(binanceResult.error || "Binance order failed");
    }

    return binanceResult.data;
}

/**
 * Handle Database Updates (Position & Order)
 */
async function handleDbUpdates(
    bot: Bot,
    signal: Signal,
    binanceData: BinanceOrderResponse,
    params: SpotOrderParams
) {
    const executedQty = parseFloat(binanceData.executedQty || params.quantity || "0");

    // Estimate price if not provided (Market orders might not show price immediately in some responses, but usually do)
    // If binanceData.price is 0 or undefined, we might need to calculate from cummulativeQuoteQty
    let executedPrice = 0;
    if (binanceData.cummulativeQuoteQty && parseFloat(binanceData.cummulativeQuoteQty) > 0 && executedQty > 0) {
        executedPrice = parseFloat(binanceData.cummulativeQuoteQty) / executedQty;
    } else if (binanceData.price && parseFloat(binanceData.price) > 0) {
        executedPrice = parseFloat(binanceData.price);
    } else {
        // Fallback to signal price or 0 (should rarely happen for filled orders)
        executedPrice = signal.price || 0;
    }

    const executedValue = parseFloat(binanceData.cummulativeQuoteQty || (executedQty * executedPrice).toString());

    return await db.$transaction(async (tx) => {
        if (params.side === "BUY") {
            return await handleSpotBuy(tx, bot, signal, params, executedPrice, executedQty, executedValue, binanceData.orderId.toString());
        } else {
            return await handleSpotSell(tx, bot, signal, params, executedPrice, executedQty, executedValue, binanceData.orderId.toString());
        }
    });
}

/**
 * Handle Spot Buy (Open Position)
 */
async function handleSpotBuy(
    tx: any,
    bot: Bot,
    signal: Signal,
    params: SpotOrderParams,
    executedPrice: number,
    executedQty: number,
    executedValue: number,
    binanceOrderId: string
) {
    const newPosition = await tx.position.create({
        data: {
            portfolioId: bot.portfolioId,
            botId: bot.id,
            symbol: signal.symbol,
            side: "LONG",
            type: params.type,
            entryPrice: executedPrice,
            quantity: executedQty,
            entryValue: executedValue,
            currentPrice: executedPrice,
            status: "OPEN",
            accountType: "SPOT",
            source: "BOT",
            stopLoss: bot.stopLoss ? executedPrice * (1 - bot.stopLoss / 100) : null,
            takeProfit: bot.takeProfit ? executedPrice * (1 + bot.takeProfit / 100) : null,
        },
    });

    const newOrder = await tx.order.create({
        data: {
            positionId: newPosition.id,
            portfolioId: bot.portfolioId,
            orderId: binanceOrderId,
            symbol: signal.symbol,
            type: "ENTRY",
            side: "BUY",
            orderType: params.type,
            price: executedPrice,
            quantity: executedQty,
            value: executedValue,
            status: "FILLED",
            fillPercent: 100,
        },
    });

    return { positionId: newPosition.id, orderId: newOrder.id };
}

/**
 * Handle Spot Sell (Close Position)
 */
async function handleSpotSell(
    tx: any,
    bot: Bot,
    signal: Signal,
    params: SpotOrderParams,
    executedPrice: number,
    executedQty: number,
    executedValue: number,
    binanceOrderId: string
) {
    // Find oldest open position
    const existingPosition = await tx.position.findFirst({
        where: {
            botId: bot.id,
            symbol: signal.symbol,
            side: "LONG",
            status: "OPEN",
        },
        orderBy: { createdAt: "asc" },
    });

    let positionId = "";

    if (existingPosition) {
        await tx.position.update({
            where: { id: existingPosition.id },
            data: {
                status: "CLOSED",
                exitPrice: executedPrice,
                exitValue: executedValue,
                closedAt: new Date(),
                pnl: executedValue - existingPosition.entryValue,
                pnlPercent: ((executedValue - existingPosition.entryValue) / existingPosition.entryValue) * 100,
            },
        });
        positionId = existingPosition.id;
    } else {
        // Create standalone closed position if none found
        const newPosition = await tx.position.create({
            data: {
                portfolioId: bot.portfolioId,
                botId: bot.id,
                symbol: signal.symbol,
                side: "LONG",
                type: params.type,
                entryPrice: 0,
                quantity: executedQty,
                entryValue: 0,
                currentPrice: executedPrice,
                status: "CLOSED",
                accountType: "SPOT",
                source: "BOT",
                exitPrice: executedPrice,
                exitValue: executedValue,
                closedAt: new Date(),
            },
        });
        positionId = newPosition.id;
    }

    const newOrder = await tx.order.create({
        data: {
            positionId,
            portfolioId: bot.portfolioId,
            orderId: binanceOrderId,
            symbol: signal.symbol,
            type: "EXIT",
            side: "SELL",
            orderType: params.type,
            price: executedPrice,
            quantity: executedQty,
            value: executedValue,
            status: "FILLED",
            fillPercent: 100,
        },
    });

    return { positionId, orderId: newOrder.id };
}

async function updateStatsAsync(botId: string, userId: string) {
    setImmediate(async () => {
        try {
            const { recalculatePortfolioStatsInternal } = await import("@/db/actions/portfolio/recalculate-stats");
            await recalculatePortfolioStatsInternal(userId);
        } catch (e) {
            console.error("Failed to update stats async", e);
        }
    });
}
