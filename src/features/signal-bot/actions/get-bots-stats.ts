/**
 * Get Bots Stats Server Action
 * 
 * Calculates aggregate statistics for signal bots.
 */

"use server";

import { cache } from "react";
import { db } from "@/lib/db/client";
import { getUserWithRole } from "@/lib/auth-utils";
import { getSelectedUser } from "@/lib/selected-user-server";

export interface BotStatsResult {
    totalBots: number;
    activeBots: number;
    totalTrades: number;
    totalPnl: number;
    winRate: number;
}

/**
 * Get aggregate bot statistics for a user
 */
export const getBotsStats = cache(async (input: { userId?: string } = {}): Promise<{ success: boolean; data?: BotStatsResult; error?: string }> => {
    try {
        const user = await getUserWithRole();
        if (!user) throw new Error("Unauthorized");

        const { userId } = input;

        // Check if admin is using selected user
        const selectedUser = await getSelectedUser();
        const targetUserId = userId || selectedUser?.id || user.id;

        const bots = await db.bot.findMany({
            where: {
                portfolio: {
                    userId: targetUserId,
                },
            },
            select: {
                isActive: true,
                totalTrades: true,
                winTrades: true,
                totalPnl: true,
            },
        });

        const totalBots = bots.length;
        const activeBots = bots.filter(bot => bot.isActive).length;
        const totalTrades = bots.reduce((sum, bot) => sum + bot.totalTrades, 0);
        const totalPnl = bots.reduce((sum, bot) => sum + bot.totalPnl, 0);
        const totalWins = bots.reduce((sum, bot) => sum + (bot.winTrades || 0), 0);

        const winRate = totalTrades > 0 ? (totalWins / totalTrades) * 100 : 0;

        return {
            success: true,
            data: {
                totalBots,
                activeBots,
                totalTrades,
                totalPnl,
                winRate,
            }
        };
    } catch (error) {
        console.error("Error fetching bot stats:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to fetch bot statistics"
        };
    }
});
