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
import { createSpotClient, createMarginClient, closeSpotPosition, closeMarginPosition } from "@/features/binance";
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

        // Close position via Binance SDK
        let result;
        if (position.accountType === "MARGIN") {
            const client = createMarginClient({
                apiKey: exchange.apiKey,
                apiSecret: exchange.apiSecret,
            });

            result = await closeMarginPosition(client, {
                symbol: position.symbol,
                side: position.side as "LONG" | "SHORT",
                quantity: position.quantity.toString(),
                sideEffectType: sideEffectType as "NO_SIDE_EFFECT" | "AUTO_REPAY",
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
