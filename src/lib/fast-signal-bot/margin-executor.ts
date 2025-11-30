import db from "@/db";
import { Action, Bot, Signal } from "@prisma/client";
import { MarginOrderParams, BinanceConfig, BinanceOrderResponse } from "../services/exchange/types";
import { placeMarginOrder } from "../services/exchange/binance-margin";
import { ValidationResult } from "./margin-validator";

export interface ExecutionResult {
    success: boolean;
    orderId?: string;
    positionId?: string;
    message?: string;
    error?: string;
    executionTime?: number;
}

export interface MarginExecutionContext {
    bot: Bot & {
        portfolio: { userId: string };
        exchange: { apiKey: string; apiSecret: string };
    };
    signal: Signal;
    validation: ValidationResult;
}

/**
 * Fast Margin Execution (Cross Margin)
 * Orchestrates: Prepare -> Execute -> DB Update -> Stats
 */
export async function executeMarginTrade(
    context: MarginExecutionContext
): Promise<ExecutionResult> {
    const startTime = Date.now();
    const { bot, signal, validation } = context;

    if (!validation.success || !validation.data) {
        return { success: false, error: validation.error || "Validation failed" };
    }

    try {
        // 1. Prepare Params
        const params = prepareMarginOrderParams(bot, signal, validation.data);
        const config: BinanceConfig = {
            apiKey: bot.exchange.apiKey,
            apiSecret: bot.exchange.apiSecret,
        };

        console.log(`[FastMargin] Executing ${params.side} ${params.symbol} Qty:${params.quantity} Type:${params.type} SideEffect:${params.sideEffectType}`);

        // 2. Execute on Binance
        const binanceData = await executeBinanceMarginOrder(config, params);

        // 3. Handle DB Updates
        const result = await handleMarginDbUpdates(bot, signal, binanceData, params);

        // 4. Update Stats Async
        updateStatsAsync(bot.id, bot.portfolio.userId);

        return {
            success: true,
            orderId: result.orderId,
            positionId: result.positionId,
            message: `Successfully executed ${params.side} ${params.symbol} (${params.sideEffectType})`,
            executionTime: Date.now() - startTime,
        };

    } catch (error) {
        console.error("[FastMargin] Execution error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Execution failed",
            executionTime: Date.now() - startTime,
        };
    }
}

/**
 * Prepare Binance Margin Order Parameters
 */
export function prepareMarginOrderParams(
    bot: Bot,
    signal: Signal,
    validationData: NonNullable<ValidationResult["data"]>
): MarginOrderParams {
    const type = bot.orderType === "Limit" ? "LIMIT" : "MARKET";
    let side: "BUY" | "SELL";
    let sideEffectType: "MARGIN_BUY" | "AUTO_REPAY" | "NO_SIDE_EFFECT";

    // Determine Side and SideEffect
    switch (signal.action) {
        case Action.ENTER_LONG:
            side = "BUY";
            sideEffectType = "MARGIN_BUY"; // Borrow if needed
            break;
        case Action.EXIT_LONG:
            side = "SELL";
            sideEffectType = "AUTO_REPAY"; // Repay debt
            break;
        case Action.ENTER_SHORT:
            side = "SELL";
            sideEffectType = "MARGIN_BUY"; // Borrow to short
            break;
        case Action.EXIT_SHORT:
            side = "BUY";
            sideEffectType = "AUTO_REPAY"; // Buy back to repay
            break;
        default:
            throw new Error("Invalid action for margin trade");
    }

    const params: MarginOrderParams = {
        symbol: signal.symbol,
        side,
        type,
        quantity: validationData.formattedQuantity.toFixed(8),
        sideEffectType,
    };

    if (type === "LIMIT") {
        params.price = validationData.currentPrice.toFixed(2); // TODO: Use proper precision
        params.timeInForce = "GTC";
    }

    return params;
}

/**
 * Execute Order on Binance
 */
export async function executeBinanceMarginOrder(
    config: BinanceConfig,
    params: MarginOrderParams
): Promise<BinanceOrderResponse> {
    const binanceResult = await placeMarginOrder(config, params);

    if (!binanceResult.success || !binanceResult.data) {
        throw new Error(binanceResult.error || "Binance margin order failed");
    }

    return binanceResult.data;
}

/**
 * Handle Database Updates (Position & Order)
 */
async function handleMarginDbUpdates(
    bot: Bot,
    signal: Signal,
    binanceData: BinanceOrderResponse,
    params: MarginOrderParams
) {
    const executedQty = parseFloat(binanceData.executedQty || params.quantity || "0");

    // Calculate executed price
    let executedPrice = 0;
    if (binanceData.cummulativeQuoteQty && parseFloat(binanceData.cummulativeQuoteQty) > 0 && executedQty > 0) {
        executedPrice = parseFloat(binanceData.cummulativeQuoteQty) / executedQty;
    } else if (binanceData.price && parseFloat(binanceData.price) > 0) {
        executedPrice = parseFloat(binanceData.price);
    } else {
        executedPrice = signal.price || 0;
    }

    const executedValue = parseFloat(binanceData.cummulativeQuoteQty || (executedQty * executedPrice).toString());

    return await db.$transaction(async (tx) => {
        if (signal.action === Action.ENTER_LONG) {
            return await handleMarginOpen(tx, bot, signal, params, executedPrice, executedQty, executedValue, binanceData.orderId.toString(), "LONG");
        } else if (signal.action === Action.ENTER_SHORT) {
            return await handleMarginOpen(tx, bot, signal, params, executedPrice, executedQty, executedValue, binanceData.orderId.toString(), "SHORT");
        } else if (signal.action === Action.EXIT_LONG) {
            return await handleMarginClose(tx, bot, signal, params, executedPrice, executedQty, executedValue, binanceData.orderId.toString(), "LONG");
        } else { // EXIT_SHORT
            return await handleMarginClose(tx, bot, signal, params, executedPrice, executedQty, executedValue, binanceData.orderId.toString(), "SHORT");
        }
    });
}

/**
 * Handle Margin Open (Long or Short)
 */
async function handleMarginOpen(
    tx: any,
    bot: Bot,
    signal: Signal,
    params: MarginOrderParams,
    executedPrice: number,
    executedQty: number,
    executedValue: number,
    binanceOrderId: string,
    positionSide: "LONG" | "SHORT"
) {
    const newPosition = await tx.position.create({
        data: {
            portfolioId: bot.portfolioId,
            botId: bot.id,
            symbol: signal.symbol,
            side: positionSide,
            type: params.type,
            entryPrice: executedPrice,
            quantity: executedQty,
            entryValue: executedValue,
            currentPrice: executedPrice,
            status: "OPEN",
            accountType: "MARGIN",
            source: "BOT",
            stopLoss: bot.stopLoss ? (positionSide === "LONG" ? executedPrice * (1 - bot.stopLoss / 100) : executedPrice * (1 + bot.stopLoss / 100)) : null,
            takeProfit: bot.takeProfit ? (positionSide === "LONG" ? executedPrice * (1 + bot.takeProfit / 100) : executedPrice * (1 - bot.takeProfit / 100)) : null,
        },
    });

    const newOrder = await tx.order.create({
        data: {
            positionId: newPosition.id,
            portfolioId: bot.portfolioId,
            orderId: binanceOrderId,
            symbol: signal.symbol,
            type: "ENTRY",
            side: params.side,
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
 * Handle Margin Close (Long or Short)
 */
async function handleMarginClose(
    tx: any,
    bot: Bot,
    signal: Signal,
    params: MarginOrderParams,
    executedPrice: number,
    executedQty: number,
    executedValue: number,
    binanceOrderId: string,
    positionSide: "LONG" | "SHORT"
) {
    // Find oldest open position of this side
    const existingPosition = await tx.position.findFirst({
        where: {
            botId: bot.id,
            symbol: signal.symbol,
            side: positionSide,
            status: "OPEN",
        },
        orderBy: { createdAt: "asc" },
    });

    let positionId = "";

    if (existingPosition) {
        // Calculate PnL
        let pnl = 0;
        let pnlPercent = 0;

        if (positionSide === "LONG") {
            pnl = executedValue - existingPosition.entryValue;
            pnlPercent = ((executedValue - existingPosition.entryValue) / existingPosition.entryValue) * 100;
        } else {
            // Short PnL: Entry Value - Exit Value (Profit if Exit < Entry)
            pnl = existingPosition.entryValue - executedValue;
            pnlPercent = ((existingPosition.entryValue - executedValue) / existingPosition.entryValue) * 100;
        }

        await tx.position.update({
            where: { id: existingPosition.id },
            data: {
                status: "CLOSED",
                exitPrice: executedPrice,
                exitValue: executedValue,
                closedAt: new Date(),
                pnl: pnl,
                pnlPercent: pnlPercent,
            },
        });
        positionId = existingPosition.id;
    } else {
        // Create standalone closed position
        const newPosition = await tx.position.create({
            data: {
                portfolioId: bot.portfolioId,
                botId: bot.id,
                symbol: signal.symbol,
                side: positionSide,
                type: params.type,
                entryPrice: 0, // Unknown
                quantity: executedQty,
                entryValue: 0,
                currentPrice: executedPrice,
                status: "CLOSED",
                accountType: "MARGIN",
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
            side: params.side,
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
