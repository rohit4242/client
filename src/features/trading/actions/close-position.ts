/**
 * Trading Actions - Close Position
 * 
 * Server action for closing positions
 */

"use server";

import { z } from "zod";
import { requireAuth } from "@/lib/auth/session";
import { handleServerError, successResult, type ServerActionResult } from "@/lib/validation/error-handler";
import { db } from "@/lib/db/client";
import { createSpotClient, createMarginClient, closeSpotPosition, closeMarginPosition, cancelMarginOCOOrder } from "@/features/binance";
import { formatQuantityToLotSize, getSymbolLotSize } from "@/lib/signal-bot/exchange-info-utils";
import type { TradingResult } from "../types/trading.types";
import { revalidatePath } from "next/cache";
import { getSelectedUser } from "@/lib/selected-user-server";

const ClosePositionInputSchema = z.object({
    positionId: z.string().uuid(),
    sideEffectType: z.enum(["NO_SIDE_EFFECT", "AUTO_REPAY"]).optional(),
});

export async function closePositionAction(
    input: unknown
): Promise<ServerActionResult<TradingResult>> {
    try {
        const selectedUser = await getSelectedUser();


        if (!selectedUser) {
            return {
                success: false,
                error: "User not selected",
            };
        }
        // Validate input
        const validated = ClosePositionInputSchema.parse(input);
        const { positionId, sideEffectType } = validated;

        // Get position with exchange
        const position = await db.position.findFirst({
            where: {
                id: positionId,
                portfolio: {
                    userId: selectedUser.id,
                },
            },
            include: {
                portfolio: true,
                bot: {
                    include: {
                        exchange: true,
                    },
                },
                orders: {
                    where: {
                        type: { in: ['TAKE_PROFIT', 'STOP_LOSS'] },
                        status: 'NEW'
                    }
                }
            },
        });

        if (!position) {
            return {
                success: false,
                error: "Position not found or access denied",
            };
        }

        if (position.status === "CLOSED") {
            return {
                success: false,
                error: "Position is already closed",
            };
        }

        const exchange = position.bot?.exchange;
        if (!exchange) {
            return {
                success: false,
                error: "Exchange not found",
            };
        }

        // Step 1: Cancel active OCO orders on Binance
        const activeOCOOrders = position.orders.filter(order => order.status === 'NEW');

        if (activeOCOOrders.length > 0) {
            console.log('[Close Position] Canceling active OCO orders on Binance');

            const client = createMarginClient({
                apiKey: exchange.apiKey,
                apiSecret: exchange.apiSecret,
            });

            // Get unique orderListIds (both TP and SL share same orderListId)
            const orderListIds = [...new Set(
                activeOCOOrders
                    .map(o => o.orderListId)
                    .filter(Boolean)
            )];

            console.log('[Close Position] Found OCO orderListIds:', orderListIds);

            // Cancel each OCO order list on Binance
            for (const orderListId of orderListIds) {
                try {
                    const cancelResult = await cancelMarginOCOOrder(client, {
                        symbol: position.symbol,
                        orderListId: parseInt(orderListId!),
                    });

                    console.log('[Close Position] OCO canceled on Binance:', {
                        orderListId,
                        success: cancelResult.success
                    });
                } catch (error) {
                    console.warn('[Close Position] OCO cancel failed (continuing anyway):', error);
                    // Continue - order might be already filled/canceled
                }
            }

            // Update database status
            await db.order.updateMany({
                where: {
                    positionId: position.id,
                    type: { in: ['TAKE_PROFIT', 'STOP_LOSS'] },
                    status: 'NEW'
                },
                data: {
                    status: 'CANCELED'
                }
            });

            console.log('[Close Position] OCO orders canceled and database updated');
        } else {
            console.log('[Close Position] No active OCO orders to cancel');
        }

        // Step 2: Close position via Binance SDK
        let result;
        if (position.accountType === "MARGIN") {
            const client = createMarginClient({
                apiKey: exchange.apiKey,
                apiSecret: exchange.apiSecret,
            });

            // Determine sideEffectType for closing
            // If position was opened with AUTO_BORROW_REPAY or MARGIN_BUY, use AUTO_REPAY when closing
            let closeSideEffect: "NO_SIDE_EFFECT" | "AUTO_REPAY" =
                sideEffectType as "NO_SIDE_EFFECT" | "AUTO_REPAY" || "NO_SIDE_EFFECT";

            // Auto-detect: if position was opened with borrow, use AUTO_REPAY
            if (!sideEffectType && position.sideEffectType) {
                if (position.sideEffectType === "AUTO_BORROW_REPAY" || position.sideEffectType === "MARGIN_BUY") {
                    closeSideEffect = "AUTO_REPAY";
                    console.log('[Close Position] Auto-detected borrowed position, using AUTO_REPAY');
                }
            }

            console.log('[Close Position] Closing with sideEffectType:', closeSideEffect);

            // Format quantity using actual LOT_SIZE from Binance
            const apiConfig = {
                apiKey: exchange.apiKey,
                apiSecret: exchange.apiSecret,
            };
            const lotSize = await getSymbolLotSize(apiConfig, position.symbol);
            let closeQuantity: number;

            if (lotSize) {
                closeQuantity = formatQuantityToLotSize(position.quantity, lotSize);
                console.log('[Close Position] Quantity formatted with LOT_SIZE:', {
                    stored: position.quantity,
                    lotSize,
                    formatted: closeQuantity
                });
            } else {
                // Fallback: use position.quantity rounded to 8 decimals
                closeQuantity = parseFloat(position.quantity.toFixed(8));
                console.log('[Close Position] Using fallback quantity (no LOT_SIZE):', closeQuantity);
            }

            result = await closeMarginPosition(client, {
                symbol: position.symbol,
                side: position.side as "LONG" | "SHORT",
                quantity: closeQuantity.toString(),
                sideEffectType: closeSideEffect,
            });
        } else {
            const client = createSpotClient({
                apiKey: exchange.apiKey,
                apiSecret: exchange.apiSecret,
            });

            result = await closeSpotPosition(client, {
                symbol: position.symbol,
                side: position.side as "LONG" | "SHORT",
                quantity: position.quantity.toString(),
            });
        }

        if (!result.success || !result.data) {
            return {
                success: false,
                error: result.error || "Failed to close position on exchange",
            };
        }

        // FIXED: Calculate PnL with correct field names
        const exitValue = parseFloat(result.data.cummulativeQuoteQty || "0");
        const exitPrice = exitValue / position.quantity;
        const pnl = position.side === "LONG"
            ? exitValue - position.entryValue
            : position.entryValue - exitValue;
        const pnlPercent = position.entryValue > 0 ? (pnl / position.entryValue) * 100 : 0;

        // Update position in database
        await db.position.update({
            where: { id: positionId },
            data: {
                status: "CLOSED",
                exitPrice,
                exitValue,    // FIXED: Added exitValue
                pnl,          // FIXED: Changed from realizedPnl to pnl
                pnlPercent,   // FIXED: Added pnlPercent
                closedAt: new Date(),
                // Update OCO statuses
                stopLossStatus: position.stopLossOrderId ? 'CANCELED' : null,
                takeProfitStatus: position.takeProfitOrderId ? 'CANCELED' : null,
            },
        });

        // Create exit order record
        await db.order.create({
            data: {
                portfolioId: position.portfolioId,
                positionId,
                orderId: result.data.orderId.toString(),
                clientOrderId: result.data.clientOrderId,
                symbol: result.data.symbol,
                type: "EXIT",
                side: position.side === "LONG" ? "SELL" : "BUY",
                orderType: "MARKET",
                price: exitPrice,
                quantity: position.quantity,
                value: exitValue,
                executedQty: parseFloat(result.data.executedQty || "0"),
                cummulativeQuoteQty: parseFloat(result.data.cummulativeQuoteQty || "0"),
                quoteOrderQty: exitValue, // FIXED: Added quoteOrderQty
                status: result.data.status as any || "FILLED",
                fillPercent: 100,
                accountType: position.accountType,
                marginType: position.marginType,
                sideEffectType: sideEffectType as any || "NO_SIDE_EFFECT",
                transactTime: result.data.transactTime ? new Date(result.data.transactTime) : null,
            },
        });

        // Revalidate paths
        revalidatePath("/trading");
        revalidatePath("/positions");
        revalidatePath("/portfolio");

        return successResult({
            success: true,
            positionId,
            orderId: result.data.orderId.toString(),
            executedPrice: exitPrice,
        });
    } catch (error) {
        return handleServerError(error, "Failed to close position");
    }
}
