/**
 * Close All Positions Server Action
 * 
 * Closes all open positions via the exchange API
 */

"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import { requireAuth } from "@/lib/auth/session";
import { handleServerError, successResult, ServerActionResult } from "@/lib/validation/error-handler";
import { closePositionAction } from "./close-position";
import { getSelectedUser } from "@/lib/selected-user-server";

export interface CloseAllPositionsResult {
    totalCount: number;
    successCount: number;
    failedCount: number;
    results: Array<{
        positionId: string;
        symbol: string;
        success: boolean;
        error?: string;
    }>;
}

/**
 * Close all open positions via exchange
 * 
 * This action:
 * 1. Fetches all OPEN positions for the user
 * 2. Closes each via the exchange API using closePositionAction
 * 3. Returns detailed results including successes and failures
 */
export async function closeAllPositionsAction(): Promise<ServerActionResult<CloseAllPositionsResult>> {
    try {
        const session = await requireAuth();
        const selectedUser = await getSelectedUser();
        const targetUserId = selectedUser?.id || session.id;

        // Get all open positions for user
        const openPositions = await db.position.findMany({
            where: {
                portfolio: {
                    userId: targetUserId,
                },
                status: "OPEN",
            },
            select: {
                id: true,
                symbol: true,
            },
        });

        if (openPositions.length === 0) {
            return successResult({
                totalCount: 0,
                successCount: 0,
                failedCount: 0,
                results: [],
            });
        }

        console.log(`[Close All] Starting to close ${openPositions.length} positions`);

        const results: CloseAllPositionsResult["results"] = [];
        let successCount = 0;
        let failedCount = 0;

        // Process all positions
        for (const position of openPositions) {
            try {
                const result = await closePositionAction({
                    positionId: position.id,
                });

                if (result.success) {
                    results.push({
                        positionId: position.id,
                        symbol: position.symbol,
                        success: true,
                    });
                    successCount++;
                    console.log(`[Close All] ✅ Closed ${position.symbol} (${position.id})`);
                } else {
                    results.push({
                        positionId: position.id,
                        symbol: position.symbol,
                        success: false,
                        error: result.error || "Unknown error",
                    });
                    failedCount++;
                    console.error(`[Close All] ❌ Failed ${position.symbol}: ${result.error}`);
                }
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : "Unknown error";
                results.push({
                    positionId: position.id,
                    symbol: position.symbol,
                    success: false,
                    error: errorMessage,
                });
                failedCount++;
                console.error(`[Close All] ❌ Error closing ${position.symbol}:`, error);
            }

            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        console.log(`[Close All] Complete: ${successCount} succeeded, ${failedCount} failed`);

        // Revalidate paths
        revalidatePath("/positions");
        revalidatePath("/(admin)", "layout");

        return successResult({
            totalCount: openPositions.length,
            successCount,
            failedCount,
            results,
        });
    } catch (error) {
        console.error("[Close All] Unexpected error:", error);
        return handleServerError(error, "Failed to close all positions");
    }
}
