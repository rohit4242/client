/**
 * Get Bot Server Action
 * 
 * Fetches a single bot by ID with all related data.
 */

"use server";

import { cache } from "react";
import { db } from "@/lib/db/client";
import { getUserWithRole } from "@/lib/auth-utils";
import { enrichBotWithExchange, toBotClient, type GetBotResult } from "../schemas/bot.schema";

/**
 * Get bot by ID
 * Ensures user owns the bot
 * Cached for the duration of the request
 */
export const getBot = cache(async (
    id: string
): Promise<GetBotResult> => {
    try {
        const user = await getUserWithRole();
        if (!user) throw new Error("Unauthorized");

        // Fetch bot with ownership check
        const bot = await db.bot.findFirst({
            where: {
                id,
                portfolio: {
                    userId: user.id,
                },
            },
            include: {
                exchange: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        if (!bot) {
            return { bot: null };
        }

        // Transform to client format with calculations
        const clientBot = toBotClient(bot);
        const enrichedBot = enrichBotWithExchange(clientBot, bot.exchange);

        return { bot: enrichedBot };
    } catch (error) {
        console.error("Error fetching bot:", error);
        throw error;
    }
});
