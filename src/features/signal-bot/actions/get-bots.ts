/**
 * Get Bots Server Action
 * 
 * Fetches signal bots with optional filters.
 */

"use server";

import { cache } from "react";
import { db } from "@/lib/db/client";
import { getUserWithRole } from "@/lib/auth-utils";
import { getSelectedUser } from "@/lib/selected-user-server";
import { GetBotsInputSchema, enrichBotWithExchange, toBotClient, type GetBotsInput, type GetBotsResult } from "../schemas/bot.schema";

/**
 * Get bots with filters
 * Cached for the duration of the request
 */
export const getBots = cache(async (
    input: GetBotsInput = {}
): Promise<GetBotsResult> => {
    try {
        const user = await getUserWithRole();
        if (!user) throw new Error("Unauthorized");

        // Validate input
        const validated = GetBotsInputSchema.parse(input);
        const { isActive, accountType, userId } = validated;

        // Check if admin is using selected user
        const selectedUser = await getSelectedUser();
        const targetUserId = userId || selectedUser?.id || user.id;

        // Build where clause
        const where = {
            portfolio: {
                userId: targetUserId,
            },
            ...(isActive !== undefined && { isActive }),
            ...(accountType && { accountType }),
        };

        // Fetch bots with exchange info
        const [bots, total] = await Promise.all([
            db.bot.findMany({
                where,
                include: {
                    exchange: {
                        select: {
                            id: true,
                            name: true,
                            spotValue: true,
                            marginValue: true,
                            totalValue: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: "desc",
                },
            }),
            db.bot.count({ where }),
        ]);

        // Transform to client format with calculations
        const enrichedBots = bots.map((bot) => {
            const clientBot = toBotClient(bot);
            return enrichBotWithExchange(clientBot, bot.exchange);
        });

        return {
            bots: enrichedBots,
            total,
        };
    } catch (error) {
        console.error("Error fetching bots:", error);
        return {
            bots: [],
            total: 0,
        };
    }
});

/**
 * Get active bots only
 */
export const getActiveBots = cache(async (): Promise<GetBotsResult> => {
    return getBots({ isActive: true });
});
