/**
 * Get Portfolio History Server Action
 * 
 * Fetches portfolio history for charts.
 * Returns balance snapshots over time.
 */

"use server";

import { cache } from "react";
import { db } from "@/lib/db/client";
import { requireAuth } from "@/lib/auth/session";
import { getSelectedUser } from "@/lib/selected-user-server";
import { GetPortfolioHistoryInputSchema, type GetPortfolioHistoryInput, type GetPortfolioHistoryResult, type ChartDataPoint } from "../schemas/portfolio.schema";
import { subDays, subWeeks, subMonths, subYears, startOfDay } from "date-fns";

/**
 * Calculate date range based on period
 */
function getDateRange(period: "day" | "week" | "month" | "year" | "all"): Date | null {
    const now = startOfDay(new Date());

    switch (period) {
        case "day":
            return subDays(now, 1);
        case "week":
            return subWeeks(now, 1);
        case "month":
            return subMonths(now, 1);
        case "year":
            return subYears(now, 1);
        case "all":
            return null; // No date filter
    }
}

/**
 * Get portfolio history for charts
 * Cached for the duration of the request
 */
export const getPortfolioHistory = cache(async (
    input: GetPortfolioHistoryInput = { period: "month" }
): Promise<GetPortfolioHistoryResult> => {
    try {
        const session = await requireAuth();

        // Validate input
        const validated = GetPortfolioHistoryInputSchema.parse(input);
        const { period, userId } = validated;

        // Check if admin is using selected user
        const selectedUser = await getSelectedUser();
        const targetUserId = userId || selectedUser?.id || session.id;

        // Get user's portfolio
        const portfolio = await db.portfolio.findFirst({
            where: { userId: targetUserId },
        });

        if (!portfolio) {
            return { data: [], period };
        }

        // Calculate date range
        const fromDate = getDateRange(period);

        // Fetch balance snapshots
        const snapshots = await db.balanceSnapshot.findMany({
            where: {
                portfolioId: portfolio.id,
                ...(fromDate && {
                    timestamp: {
                        gte: fromDate,
                    },
                }),
            },
            orderBy: {
                timestamp: "asc",
            },
        });

        // Convert to chart data points
        const data: ChartDataPoint[] = snapshots.map((snapshot, index) => {
            const previousValue = index > 0 ? snapshots[index - 1].totalValue : portfolio.initialBalance;
            const change = previousValue > 0
                ? ((snapshot.totalValue - previousValue) / previousValue) * 100
                : 0;

            return {
                date: snapshot.timestamp.toISOString(),
                value: snapshot.totalValue,
                pnl: snapshot.totalPnl,
                change,
            };
        });

        return { data, period };
    } catch (error) {
        console.error("Error fetching portfolio history:", error);
        return { data: [], period: input.period || "month" };
    }
});
