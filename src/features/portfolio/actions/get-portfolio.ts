/**
 * Get Portfolio Server Action
 * 
 * Fetches the portfolio for the current user.
 */

"use server";

import { cache } from "react";
import { db } from "@/lib/db/client";
import { requireAuth } from "@/lib/auth/session";
import { getSelectedUser } from "@/lib/selected-user-server";
import { toPortfolioClient, type GetPortfolioResult } from "../schemas/portfolio.schema";

/**
 * Get portfolio for current user
 * Returns null if no portfolio exists
 * Cached for the duration of the request
 */
export const getPortfolio = cache(async (): Promise<GetPortfolioResult> => {
    try {
        const session = await requireAuth();

        // Check if admin is using selected user
        const selectedUser = await getSelectedUser();
        const targetUserId = selectedUser?.id || session.id;

        // Fetch portfolio
        const portfolio = await db.portfolio.findFirst({
            where: { userId: targetUserId },
        });

        // Return null if no portfolio exists
        if (!portfolio) {
            return { portfolio: null };
        }

        // Convert to client-safe format
        return { portfolio: toPortfolioClient(portfolio) };
    } catch (error) {
        console.error("Error fetching portfolio:", error);
        return { portfolio: null };
    }
});
