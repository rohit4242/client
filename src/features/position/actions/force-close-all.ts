/**
 * Force Close All Positions Server Action
 * 
 * Force closes all positions in the database only (no exchange interaction).
 * This is for development/testing purposes only.
 */

"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import { requireAuth } from "@/lib/auth/session";
import { handleServerError, successResult, ServerActionResult } from "@/lib/validation/error-handler";
import { ForceCloseAllInputSchema, ForceCloseAllResultSchema, type ForceCloseAllResult } from "../schemas/position.schema";
import { PositionStatus } from "@prisma/client";
import { getSelectedUser } from "@/lib/selected-user-server";

/**
 * Force close all open positions (database only)
 * 
 * WARNING: This does not execute trades on the exchange.
 * Use only for development/testing or cleaning up stale positions.
 */
export async function forceCloseAll(
    input: { userId?: string } = {}
): Promise<ServerActionResult<ForceCloseAllResult>> {
    try {
        const session = await requireAuth();

        // Validate input
        const validated = ForceCloseAllInputSchema.parse(input);

        // Check if admin is using selected user
        const selectedUser = await getSelectedUser();
        const targetUserId = validated.userId || selectedUser?.id || session.id;

        // Get all open positions for user
        const openPositions = await db.position.findMany({
            where: {
                portfolio: {
                    userId: targetUserId,
                },
                status: PositionStatus.OPEN,
            },
        });

        if (openPositions.length === 0) {
            return successResult({
                closedCount: 0,
                failedCount: 0,
                results: [],
            });
        }

        const results: Array<{
            positionId: string;
            success: boolean;
            error?: string;
        }> = [];

        let closedCount = 0;
        let failedCount = 0;

        // Update all positions to CLOSED status
        for (const position of openPositions) {
            try {
                await db.position.update({
                    where: { id: position.id },
                    data: {
                        status: PositionStatus.CLOSED,
                        closedAt: new Date(),
                        // Keep existing PnL values
                    },
                });

                results.push({
                    positionId: position.id,
                    success: true,
                });
                closedCount++;
            } catch (error) {
                results.push({
                    positionId: position.id,
                    success: false,
                    error: error instanceof Error ? error.message : "Unknown error",
                });
                failedCount++;
            }
        }

        // Revalidate paths
        revalidatePath("/positions");
        revalidatePath("/(admin)", "layout");

        const result: ForceCloseAllResult = {
            closedCount,
            failedCount,
            results,
        };

        return successResult(result);
    } catch (error) {
        return handleServerError(error, "Failed to force close positions");
    }
}
