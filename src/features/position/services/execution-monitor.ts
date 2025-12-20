import { db } from "@/lib/db/client";
import { recalculatePortfolioStatsInternal } from "@/db/actions/portfolio/recalculate-stats";

/**
 * Handle execution report from Binance User Data Stream
 */
export async function handleExecutionReport(userId: string, event: any) {
    // Only process FILLED orders
    if (event.X !== "FILLED") {
        return;
    }

    const orderId = event.i.toString();
    console.log(`[Execution Monitor] Processing FILLED order: ${orderId} for user ${userId}`);

    // Find position by order ID (either SL or TP)
    const position = await db.position.findFirst({
        where: {
            OR: [
                { stopLossOrderId: orderId },
                { takeProfitOrderId: orderId },
            ],
            status: "OPEN",
        },
        include: {
            portfolio: true
        }
    });

    if (!position) {
        // Order might be an entry order or manual trade we don't track specifically here,
        // or position already closed.
        return;
    }

    console.log(`[Execution Monitor] Matched Position ${position.id}`);

    // Determine exit reason
    const isTakeProfit = position.takeProfitOrderId === orderId;
    const isStopLoss = position.stopLossOrderId === orderId;
    const exitReason = isTakeProfit ? "TAKE_PROFIT" : (isStopLoss ? "STOP_LOSS" : "MANUAL");

    // Execution Details
    const exitPrice = parseFloat(event.L); // Last executed price
    const exitValue = parseFloat(event.Z); // Cumulative quote asset transacted qty
    const executedQty = parseFloat(event.z); // Cumulative filled qty
    const eventTime = new Date(event.T);

    // Calculate PnL
    // PnL = (Exit - Entry) * Qty for LONG
    // PnL = (Entry - Exit) * Qty for SHORT
    let pnl = 0;
    if (position.side === "LONG") {
        pnl = (exitPrice - position.entryPrice) * position.quantity;
    } else {
        pnl = (position.entryPrice - exitPrice) * position.quantity;
    }

    // Update Position
    await db.position.update({
        where: { id: position.id },
        data: {
            status: "CLOSED",
            exitValue: exitValue,
            pnl: pnl,
            pnlPercent: (pnl / position.entryValue) * 100,
            closedAt: eventTime,
            // Update statuses of protective orders
            stopLossStatus: isStopLoss ? "FILLED" : (position.stopLossOrderId ? "CANCELED" : null),
            takeProfitStatus: isTakeProfit ? "FILLED" : (position.takeProfitOrderId ? "CANCELED" : null),
        },
    });

    // Create Order Record for the Exit
    await db.order.create({
        data: {
            positionId: position.id,
            portfolioId: position.portfolioId,
            orderId: orderId,
            clientOrderId: event.c,
            symbol: event.s,
            side: event.S, // SELL or BUY
            type: event.o, // LIMIT, MARKET, STOP_LOSS, etc.
            status: "FILLED",
            price: exitPrice,
            quantity: executedQty,
            executedQty: executedQty,
            value: exitValue,
            cummulativeQuoteQty: exitValue,
            quoteOrderQty: exitValue,
            fillPercent: 100,
            accountType: position.accountType,
            sideEffectType: "AUTO_REPAY", // Assuming margin auto-repay for TP/SL
            transactTime: eventTime,
            orderType: event.o,
        },
    });

    // Recalculate Portfolio Stats
    try {
        await recalculatePortfolioStatsInternal(userId);
    } catch (error) {
        console.error(`[Execution Monitor] Failed to recalculate portfolio stats for user ${userId}`, error);
    }

    console.log(`[Execution Monitor] Successfully closed position ${position.id} with PnL ${pnl}`);
}
