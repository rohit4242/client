/**
 * Trading Engine - Position Management
 * 
 * Handles position creation, updates, and database tracking
 */

import { db } from "@/lib/db/client";
import type { NormalizedTradingRequest, TradeParams } from "../types/trading.types";
import type { BinanceOrderResponse, BinanceOCOOrderResponse } from "@/features/binance";
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
    binanceOrder: BinanceOrderResponse,
    ocoOrderIds?: { tpOrderId?: string; slOrderId?: string }
): Promise<void> {
    const executedQty = parseFloat(binanceOrder.executedQty || "0");
    const cummulativeQuoteQty = parseFloat(binanceOrder.cummulativeQuoteQty || "0");
    const executedPrice = executedQty > 0 ? cummulativeQuoteQty / executedQty : 0;

    // Calculate actual quantity after trading fees
    let actualQuantity = executedQty;
    let totalCommission = 0;
    let commissionAsset = '';

    if (binanceOrder.fills && binanceOrder.fills.length > 0) {
        // Extract base asset from symbol (e.g., BTC from BTCUSDT)
        const baseAsset = binanceOrder.symbol.replace(/USDT|BUSD|USDC|BNB$/i, '');

        // Sum up all commissions (in case of multiple fills)
        totalCommission = binanceOrder.fills.reduce((sum, fill) => {
            const commission = parseFloat(fill.commission || "0");
            const asset = fill.commissionAsset;

            // Only sum if commission is in base asset
            if (asset === baseAsset) {
                return sum + commission;
            }
            return sum;
        }, 0);

        commissionAsset = binanceOrder.fills[0].commissionAsset;

        // If commission is in base asset (e.g., BTC), subtract from quantity
        if (commissionAsset === baseAsset) {
            actualQuantity = executedQty - totalCommission;
        }
        // If commission is in quote asset (USDT) or BNB, quantity remains the same
        // (fee already deducted from cummulativeQuoteQty or paid separately)

        console.log('[Position Update] Fee calculation:', {
            symbol: binanceOrder.symbol,
            baseAsset,
            executedQty,
            totalCommission,
            commissionAsset,
            actualQuantity,
            feeDeducted: executedQty - actualQuantity
        });
    } else {
        console.log('[Position Update] No fills data, using executedQty as-is');
    }

    const newStatus = binanceOrder.status === "FILLED" ? "OPEN" : "PENDING";

    console.log('[Position Update] Updating position with execution data:', {
        positionId,
        orderId: binanceOrder.orderId,
        orderStatus: binanceOrder.status,
        newPositionStatus: newStatus,
        actualQuantity,
        executedPrice,
        hasOCO: !!ocoOrderIds
    });

    const updateData: any = {
        status: newStatus,
        entryPrice: executedPrice,
        quantity: actualQuantity,  // Store actual quantity after fees
        entryValue: cummulativeQuoteQty,
    };

    // Store OCO order IDs in position for quick reference
    if (ocoOrderIds) {
        if (ocoOrderIds.tpOrderId) {
            updateData.takeProfitOrderId = ocoOrderIds.tpOrderId;
            updateData.takeProfitStatus = "NEW";
        }
        if (ocoOrderIds.slOrderId) {
            updateData.stopLossOrderId = ocoOrderIds.slOrderId;
            updateData.stopLossStatus = "NEW";
        }
        console.log('[Position Update] OCO order IDs stored:', ocoOrderIds);
    }

    await db.position.update({
        where: { id: positionId },
        data: updateData,
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
 * Create order records for OCO protective orders
 * OCO orders contain two legs: Take Profit (LIMIT_MAKER) and Stop Loss (STOP_LOSS_LIMIT)
 * This function creates separate Order records for each leg
 */
export async function createOCOOrderRecords(
    positionId: string,
    portfolioId: string,
    ocoData: BinanceOCOOrderResponse,
    accountType: "SPOT" | "MARGIN",
    sideEffectType?: "NO_SIDE_EFFECT" | "MARGIN_BUY" | "AUTO_REPAY"
): Promise<{ tpOrderId?: string; slOrderId?: string }> {
    const result: { tpOrderId?: string; slOrderId?: string } = {};

    console.log('[OCO Orders] Creating order records for OCO:', {
        orderListId: ocoData.orderListId,
        numOrders: ocoData.orderReports?.length || 0
    });

    // Extract order details from OCO response
    for (const orderReport of ocoData.orderReports || []) {
        // Determine order type based on Binance order type
        const orderType = orderReport.type === 'LIMIT_MAKER'
            ? 'TAKE_PROFIT'
            : 'STOP_LOSS';

        // Map Binance order type to Prisma OrderOrderType enum
        // LIMIT_MAKER → TAKE_PROFIT_LIMIT (for TP in OCO)
        // STOP_LOSS_LIMIT → STOP_LOSS_LIMIT (for SL in OCO)
        const prismaOrderType = orderReport.type === 'LIMIT_MAKER'
            ? 'TAKE_PROFIT_LIMIT'
            : orderReport.type; // STOP_LOSS_LIMIT is already valid

        console.log('[OCO Orders] Creating order:', {
            type: orderType,
            orderId: orderReport.orderId,
            binanceType: orderReport.type,
            mappedOrderType: prismaOrderType,
            status: orderReport.status
        });

        const order = await db.order.create({
            data: {
                positionId,
                portfolioId,
                orderId: orderReport.orderId.toString(),
                clientOrderId: orderReport.clientOrderId || null,
                symbol: orderReport.symbol,
                side: orderReport.side as any,
                type: orderType,
                orderType: prismaOrderType as any,  // Use mapped type
                status: orderReport.status as any,
                price: parseFloat(orderReport.price || "0"),
                quantity: parseFloat(orderReport.origQty || "0"),
                executedQty: parseFloat(orderReport.executedQty || "0"),
                cummulativeQuoteQty: parseFloat(orderReport.cummulativeQuoteQty || "0"),
                value: parseFloat(orderReport.price || "0") * parseFloat(orderReport.origQty || "0"),
                fillPercent: 0,
                accountType: accountType,
                sideEffectType: sideEffectType as any || "NO_SIDE_EFFECT",
                transactTime: new Date(orderReport.transactTime || Date.now()),
            },
        });

        // Track which order ID corresponds to TP vs SL
        if (orderType === 'TAKE_PROFIT') {
            result.tpOrderId = order.orderId;
        } else {
            result.slOrderId = order.orderId;
        }

        console.log('[OCO Orders] Order created:', {
            type: orderType,
            dbId: order.id,
            orderId: order.orderId
        });
    }

    console.log('[OCO Orders] All OCO orders created:', result);
    return result;
}

/**
 * Delete pending position (rollback on error)
 */
export async function deletePendingPosition(positionId: string): Promise<void> {
    await db.position.delete({
        where: { id: positionId },
    });
}

