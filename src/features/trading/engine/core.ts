/**
 * Trading Engine - Core
 * 
 * Main entry point for all trading operations
 * Handles both manual trading and webhook signals
 */

import type { TradingRequest, TradingResult } from "../types/trading.types";
import { normalizeRequest } from "./normalization";
import { validateTradingRequest } from "./validation";
import { calculateTradeParams } from "./calculation";
import { executeBinanceTrade } from "./execution";
import {
    createPendingPosition,
    updatePositionWithExecution,
    createOrderRecord,
    deletePendingPosition,
} from "./position";
import { recalculatePortfolioStatsInternal } from "@/db/actions/portfolio/recalculate-stats";
import { db } from "@/lib/db/client";

/**
 * Execute trading request
 * 
 * Main orchestrator for all trading operations.
 * Used by both manual trading and webhook signals.
 * 
 * Flow:
 * 1. Normalize request (convert signal actions to BUY/SELL)
 * 2. Validate request (balance, limits, filters)
 * 3. Calculate trade parameters (quantities, prices)
 * 4. Create pending position in database
 * 5. Execute trade on Binance
 * 6. Update position with execution data
 * 7. Create entry order record
 * 8. Recalculate portfolio stats
 * 
 * @param request - Trading request (manual or signal)
 * @returns Trading result with position and order IDs
 */
export async function executeTradingRequest(
    request: TradingRequest
): Promise<TradingResult> {
    let createdPositionId: string | undefined;

    try {
        console.log("[Trading Engine] Starting execution:", {
            source: request.source,
            symbol: request.order.symbol,
            action: request.order.action || request.order.side,
        });

        // Step 1: Normalize request (convert signals to standard format)
        const normalized = normalizeRequest(request);
        console.log("[Trading Engine] Request normalized:", {
            side: normalized.order.side,
            type: normalized.order.type,
        });

        // Step 2: Validate request
        const validation = await validateTradingRequest(normalized);
        if (!validation.isValid || !validation.data) {
            console.error("[Trading Engine] Validation failed:", validation.errors);
            return {
                success: false,
                validationErrors: validation.errors,
                error: validation.errors?.[0] || "Validation failed",
            };
        }

        console.log("[Trading Engine] Validation passed:", {
            currentPrice: validation.data.currentPrice,
            availableBalance: validation.data.availableBalance,
        });


        // Fetch bot data if available (for TP/SL fallback)
        let bot = null;
        if (request.botId) {
            bot = await db.bot.findUnique({
                where: { id: request.botId },
                select: {
                    tradeAmountType: true,
                    tradeAmount: true,
                    stopLoss: true,
                    takeProfit: true,
                }
            });
        }

        // Step 3: Calculate trade parameters
        const tradeParams = await calculateTradeParams(normalized, validation.data, bot);
        console.log("[Trading Engine] Trade params calculated:", {
            quantity: tradeParams.quantity,
            quoteOrderQty: tradeParams.quoteOrderQty,
            expectedPrice: tradeParams.expectedPrice,
        });

        // Step 4: Create pending position
        const position = await createPendingPosition(normalized, tradeParams);
        createdPositionId = position.id;
        console.log("[Trading Engine] Position created:", position.id);

        // Step 5: Execute trade on Binance
        const binanceResult = await executeBinanceTrade(normalized, tradeParams);

        if (!binanceResult.success || !binanceResult.data) {
            console.error("[Trading Engine] Binance execution failed:", binanceResult.error);

            // Rollback: Delete pending position
            await deletePendingPosition(position.id);

            return {
                success: false,
                error: binanceResult.error || "Failed to execute trade on Binance",
            };
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const executionData: any = binanceResult.data;

        console.log("[Trading Engine] Binance order executed:", {
            orderId: executionData.orderId,
            status: executionData.status,
        });

        // Step 7: Update position with execution data
        await updatePositionWithExecution(position.id, executionData);
        console.log("[Trading Engine] Position updated with execution data");

        // Step 8: Create order record
        const order = await createOrderRecord(
            position.id,
            position.portfolioId,
            executionData,
            normalized.order.accountType,
            normalized.order.sideEffectType
        );
        console.log("[Trading Engineering] Order record created:", order.id);

        // Step 9: Recalculate portfolio stats
        try {
            await recalculatePortfolioStatsInternal(request.userId);
            console.log("[Trading Engine] Portfolio stats recalculated");
        } catch (statsError) {
            console.error("[Trading Engine] Failed to recalculate portfolio stats:", statsError);
            // Don't fail the trade if stats update fails
        }

        // Calculate execution details
        const executedQty = parseFloat(executionData.executedQty || "0");
        const cummulativeQuoteQty = parseFloat(executionData.cummulativeQuoteQty || "0");
        const executedPrice = executedQty > 0 ? cummulativeQuoteQty / executedQty : tradeParams.expectedPrice;

        console.log("[Trading Engine] Execution completed successfully:", {
            positionId: position.id,
            orderId: order.orderId,
            executedQty,
            executedPrice,
        });

        return {
            success: true,
            positionId: position.id,
            orderId: order.orderId,
            executedQty,
            executedPrice,
        };
    } catch (error) {
        console.error("[Trading Engine] Unexpected error:", error);

        // Attempt to rollback position if it was created
        if (createdPositionId) {
            try {
                await deletePendingPosition(createdPositionId);
                console.log("[Trading Engine] Rolled back position:", createdPositionId);
            } catch (rollbackError) {
                console.error("[Trading Engine] Failed to rollback position:", rollbackError);
            }
        }

        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred",
        };
    }
}
