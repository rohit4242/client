/**
 * Sync Portfolio Balance Server Action
 * 
 * Syncs portfolio balance from the active exchange.
 * Sets initial balance if not already set.
 */

"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import { requireAnyRole } from "@/lib/auth/session";
import { handleServerError, successResult, ServerActionResult } from "@/lib/validation/error-handler";
import { SyncPortfolioBalanceInputSchema, type SyncPortfolioBalanceInput, type SyncBalanceResult } from "../schemas/portfolio.schema";

/**
 * Sync portfolio balance from active exchange
 * Admin can sync for any user, customers can only sync their own
 */
export async function syncPortfolioBalance(
    input: SyncPortfolioBalanceInput = {}
): Promise<ServerActionResult<SyncBalanceResult>> {
    try {
        const user = await requireAnyRole(["ADMIN", "AGENT", "CUSTOMER"]);

        // Validate input
        const validated = SyncPortfolioBalanceInputSchema.parse(input);

        // Determine target user
        const targetUserId = validated.userId || user.id;

        // Only admins can sync other users' portfolios
        if (targetUserId !== user.id && user.role !== "ADMIN") {
            return {
                success: false,
                error: "Unauthorized - Cannot sync another user's portfolio",
            };
        }

        // Get user's portfolio with active exchange
        const portfolio = await db.portfolio.findFirst({
            where: { userId: targetUserId },
            include: {
                exchanges: {
                    where: { isActive: true },
                },
            },
        });

        if (!portfolio) {
            return {
                success: false,
                error: "Portfolio not found",
            };
        }

        // Get the first active exchange
        const activeExchange = portfolio.exchanges.find((e) => e.isActive) || portfolio.exchanges[0];

        if (!activeExchange) {
            return {
                success: false,
                error: "No active exchange found - Please add an exchange first",
            };
        }

        // Get the total value from the exchange
        const totalValue = activeExchange.totalValue || 0;

        // Only update if initialBalance is 0 (not yet set)
        if (portfolio.initialBalance === 0 && totalValue > 0) {
            await db.portfolio.update({
                where: { id: portfolio.id },
                data: {
                    initialBalance: totalValue,
                    currentBalance: totalValue,
                },
            });

            // Revalidate paths
            revalidatePath("/dashboard");
            revalidatePath("/portfolio");

            return successResult({
                initialBalance: totalValue,
                currentBalance: totalValue,
                synced: true,
            });
        }

        // Balance already set
        return successResult({
            initialBalance: portfolio.initialBalance,
            currentBalance: portfolio.currentBalance,
            synced: false,
        });
    } catch (error) {
        return handleServerError(error, "Failed to sync portfolio balance");
    }
}
