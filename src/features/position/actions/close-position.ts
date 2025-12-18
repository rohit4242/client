/**
 * Close Position Server Action
 * 
 * Closes a position at market price on the exchange.
 */

"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import { requireAuth } from "@/lib/auth/session";
import { handleServerError, successResult, ServerActionResult } from "@/lib/validation/error-handler";
import { ClosePositionInputSchema, ClosePositionResultSchema, type ClosePositionResult } from "../schemas/position.schema";
import { PositionStatus } from "@prisma/client";

/**
 * Close a position at market price
 */
export async function closePosition(
    input: { positionId: string }
): Promise<ServerActionResult<ClosePositionResult>> {
    try {
        const session = await requireAuth();

        // Validate input
        const validated = ClosePositionInputSchema.parse(input);
        const { positionId } = validated;

        // Get position with account info
        const position = await db.position.findUnique({
            where: { id: positionId },
            include: {
                portfolio: {
                    include: {
                        exchanges: true,
                    },
                },
            },
        });

        if (!position) {
            return {
                success: false,
                error: "Position not found",
            };
        }

        // Verify ownership
        if (position.portfolio.userId !== session.id) {
            return {
                success: false,
                error: "Unauthorized",
            };
        }

        // Check if position is already closed
        if (position.status === PositionStatus.CLOSED) {
            return {
                success: false,
                error: "Position is already closed",
            };
        }

        // TODO: Implement actual exchange close logic
        // For now, just update the database
        const updatedPosition = await db.position.update({
            where: { id: positionId },
            data: {
                status: PositionStatus.CLOSED,
                closedAt: new Date(),
                exitPrice: position.currentPrice || position.entryPrice,
                // PnL will be calculated by database triggers/hooks
            },
        });

        // Revalidate paths
        revalidatePath("/positions");
        revalidatePath("/(admin)", "layout");

        const closeResult: ClosePositionResult = {
            positionId: updatedPosition.id,
            orderId: "", // TODO: Get from actual order
            binanceOrderId: "", // TODO: Get from exchange
            pnl: updatedPosition.pnl,
            pnlPercent: updatedPosition.pnlPercent,
            status: updatedPosition.status,
        };

        return successResult(closeResult);
    } catch (error) {
        return handleServerError(error, "Failed to close position");
    }
}
