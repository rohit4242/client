/**
 * Get Portfolio Stats Server Action
 * 
 * Fetches comprehensive portfolio statistics.
 */

"use server";

import { cache } from "react";
import { db } from "@/lib/db/client";
import { requireAuth } from "@/lib/auth/session";
import { getSelectedUser } from "@/lib/selected-user-server";
import { PortfolioStatsSchema, type GetPortfolioStatsResult } from "../schemas/portfolio.schema";

/**
 * Get portfolio statistics for current user
 * Returns null if no portfolio exists
 * Cached for the duration of the request
 */
export const getPortfolioStats = cache(async (): Promise<GetPortfolioStatsResult> => {
    try {
        const session = await requireAuth();

        // Check if admin is using selected user
        const selectedUser = await getSelectedUser();
        const targetUserId = selectedUser?.id || session.id;

        // Fetch portfolio with only stats fields
        const portfolio = await db.portfolio.findFirst({
            where: { userId: targetUserId },
            select: {
                totalPnl: true,
                totalPnlPercent: true,
                totalWins: true,
                totalLosses: true,
                winRate: true,
                initialBalance: true,
                currentBalance: true,
                totalDeposits: true,
                totalWithdrawals: true,
                dailyPnl: true,
                weeklyPnl: true,
                monthlyPnl: true,
                totalTrades: true,
                activeTrades: true,
                avgWinAmount: true,
                avgLossAmount: true,
                largestWin: true,
                largestLoss: true,
                profitFactor: true,
                spotBalance: true,
                marginBalance: true,
                lastCalculatedAt: true,
            },
        });

        if (!portfolio) {
            return { stats: null };
        }

        // Validate and convert to client-safe format
        const stats = PortfolioStatsSchema.parse({
            ...portfolio,
            lastCalculatedAt: portfolio.lastCalculatedAt.toISOString(),
        });

        return { stats };
    } catch (error) {
        console.error("Error fetching portfolio stats:", error);
        return { stats: null };
    }
});
