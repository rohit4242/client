/**
 * Get Signals Server Action
 * 
 * Fetches signals for a specific bot or user.
 */

"use server";

import { cache } from "react";
import { db } from "@/lib/db/client";
import { getUserWithRole } from "@/lib/auth-utils";
import { getSelectedUser } from "@/lib/selected-user-server";
import { toSignalClient, type GetSignalsInput, type GetSignalsResult } from "../schemas/bot.schema";

/**
 * Get signals with filters
 * Cached for the duration of the request
 */
export const getSignals = cache(async (
    input: GetSignalsInput = {}
): Promise<GetSignalsResult> => {
    try {
        const user = await getUserWithRole();
        if (!user) throw new Error("Unauthorized");

        // Check if admin is using selected user
        const selectedUser = await getSelectedUser();
        const { botId, processed, limit = 50 } = input;

        // If no botId provided, we might want to fetch all signals for a user (Admin view)
        const targetUserId = selectedUser?.id || user.id;

        const where: any = {};

        if (botId) {
            where.botId = botId;
        } else {
            // Fetch signals for all bots in the user's portfolio
            where.bot = {
                portfolio: {
                    userId: targetUserId
                }
            };
        }

        if (processed !== undefined) {
            where.processed = processed;
        }

        const [signals, total] = await Promise.all([
            db.signal.findMany({
                where,
                include: {
                    bot: {
                        select: {
                            name: true
                        }
                    }
                },
                orderBy: {
                    createdAt: "desc"
                },
                take: limit
            }),
            db.signal.count({ where })
        ]);

        return {
            signals: signals.map(s => ({
                ...toSignalClient(s),
                botName: s.bot.name
            } as any)), // Add botanical name for UI
            total
        };
    } catch (error) {
        console.error("Error fetching signals:", error);
        return {
            signals: [],
            total: 0
        };
    }
});
