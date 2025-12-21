/**
 * Trading Engine - Position Management
 * 
 * Handles position creation, updates, and database tracking
 */

import { db } from "@/lib/db/client";
import type { NormalizedTradingRequest, TradeParams } from "../types/trading.types";
import type { BinanceOrderResponse } from "@/features/binance";
import { determinePositionSide } from "./normalization";

/**
 * Create pending position in database
 * Position is created with PENDING status before order execution
 */
export async function createPendingPosition(
    request: NormalizedTradingRequest,
    params: TradeParams
): Promise<{ id: string; portfolioId: string }> {
    const positionSide = determinePositionSide(request.order.side, undefined);

    // Calculate quantity and entry value
    const estimatedQty = parseFloat(params.quantity || params.quoteOrderQty || "0") / params.expectedPrice;
    const entryValue = estimatedQty * params.expectedPrice;

    const position = await db.position.create({
        data: {
            portfolioId: request.portfolioId,
            symbol: request.order.symbol,
            side: positionSide,
            type: request.order.type,
            accountType: request.order.accountType,
            entryPrice: params.expectedPrice,
            quantity: estimatedQty,
            entryValue: entryValue, // FIXED: Added required field
            status: "PENDING",
            source: request.source,
            botId: request.botId || null,
            sideEffectType: request.order.sideEffectType || "NO_SIDE_EFFECT",
            marginType: request.order.accountType === "MARGIN" ? "CROSS" : null,
        },
    });

    return {
        id: position.id,
        portfolioId: position.portfolioId,
    };
}

/**
 * Update position with execution data from Binance
 */
export async function updatePositionWithExecution(
    positionId: string,
    binanceOrder: BinanceOrderResponse
): Promise<void> {
    const executedQty = parseFloat(binanceOrder.executedQty || "0");
    const cummulativeQuoteQty = parseFloat(binanceOrder.cummulativeQuoteQty || "0");
    const executedPrice = executedQty > 0 ? cummulativeQuoteQty / executedQty : 0;

    const newStatus = binanceOrder.status === "FILLED" ? "OPEN" : "PENDING";

    console.log('[Position Update] Updating position with execution data:', {
        positionId,
        orderId: binanceOrder.orderId,
        orderStatus: binanceOrder.status,
        newPositionStatus: newStatus,
        executedQty,
        executedPrice
    });

    await db.position.update({
        where: { id: positionId },
        data: {
            status: newStatus,
            entryPrice: executedPrice,
            quantity: executedQty,
            entryValue: cummulativeQuoteQty,
        },
    });

    console.log('[Position Update] Position status updated to:', newStatus);
}

/**
 * Create order record in database
 */
export async function createOrderRecord(
    positionId: string,
    portfolioId: string,
    binanceOrder: BinanceOrderResponse,
    accountType: "SPOT" | "MARGIN",
    sideEffectType?: "NO_SIDE_EFFECT" | "MARGIN_BUY" | "AUTO_REPAY"
): Promise<{ id: string; orderId: string }> {
    const order = await db.order.create({
        data: {
            positionId,
            portfolioId,
            orderId: binanceOrder.orderId.toString(),
            clientOrderId: binanceOrder.clientOrderId || null,
            symbol: binanceOrder.symbol,
            side: binanceOrder.side as any,
            type: "ENTRY",
            value: parseFloat(binanceOrder.cummulativeQuoteQty || "0"),
            orderType: binanceOrder.type as any,
            status: binanceOrder.status as any,
            price: parseFloat(binanceOrder.price || "0"),
            quantity: parseFloat(binanceOrder.origQty || "0"),
            executedQty: parseFloat(binanceOrder.executedQty || "0"),
            cummulativeQuoteQty: parseFloat(binanceOrder.cummulativeQuoteQty || "0"),
            quoteOrderQty: binanceOrder.cummulativeQuoteQty ? parseFloat(binanceOrder.cummulativeQuoteQty) : null, // FIXED: Added field
            fillPercent: binanceOrder.status === "FILLED" ? 100 : 0,
            accountType: accountType,
            sideEffectType: sideEffectType as any || "NO_SIDE_EFFECT",
            transactTime: binanceOrder.transactTime ? new Date(binanceOrder.transactTime) : new Date(),
        },
    });

    return {
        id: order.id,
        orderId: order.orderId,
    };
}

/**
 * Delete pending position (rollback on error)
 */
export async function deletePendingPosition(positionId: string): Promise<void> {
    await db.position.delete({
        where: { id: positionId },
    });
}

