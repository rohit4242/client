/**
 * Get Exchanges Server Action
 * 
 * Fetches all exchanges for the current user's portfolio.
 * Supports admin viewing selected user's exchanges.
 */

"use server";

import { cache } from "react";
import { db } from "@/lib/db/client";
import { requireAuth } from "@/lib/auth/session";
import { handleServerError, successResult } from "@/lib/validation/error-handler";
import { getSelectedUser } from "@/lib/selected-user-server";
import { toExchangesClient, type GetExchangesResult } from "../schemas/exchange.schema";

/**
 * Get all exchanges for current user
 * Cached for the duration of the request
 */
export const getExchanges = cache(async (): Promise<GetExchangesResult> => {
    try {
        const session = await requireAuth();

        // Check if admin is using selected user
        const selectedUser = await getSelectedUser();
        const targetUserId = selectedUser?.id || session.id;

        // Find user's portfolio
        const portfolio = await db.portfolio.findFirst({
            where: { userId: targetUserId },
        });

        // Return empty array if no portfolio exists
        if (!portfolio) {
            return { exchanges: [] };
        }

        // Fetch exchanges
        const exchanges = await db.exchange.findMany({
            where: { portfolioId: portfolio.id },
            orderBy: { createdAt: "desc" },
        });

        // Convert to client-safe format
        return { exchanges: toExchangesClient(exchanges) };
    } catch (error) {
        console.error("Error fetching exchanges:", error);
        // Return empty array on error instead of throwing
        return { exchanges: [] };
    }
});
