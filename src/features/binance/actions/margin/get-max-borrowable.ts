/**
 * Get Max Borrowable Server Action
 * 
 * Fetches maximum borrowable amount for an asset.
 */

"use server";

import { cache } from "react";
import { db } from "@/lib/db/client";
import { requireAuth } from "@/lib/auth/session";
import { handleServerError, successResult, ServerActionResult } from "@/lib/validation/error-handler";
import { createMarginClient, getMaxBorrowable } from "../../sdk";
import { z } from "zod";
import { getSelectedUser } from "@/lib/selected-user-server";

const GetMaxBorrowableInputSchema = z.object({
    exchangeId: z.string().uuid(),
    asset: z.string().min(2).max(10),
});

export const getMaxBorrowableAction = cache(async (
    input: unknown
): Promise<ServerActionResult<{ amount: number; asset: string }>> => {
    try {
        const selectedUser = await getSelectedUser();

        if (!selectedUser) {
            return {
                success: false,
                error: "User not selected",
            };
        }

        // Validate input
        const validated = GetMaxBorrowableInputSchema.parse(input);
        const { exchangeId, asset } = validated;

        console.log(`[getMaxBorrowableAction] Fetching for asset ${asset} on exchange ${exchangeId}`);

        // Get user's exchange
        const exchange = await db.exchange.findFirst({
            where: {
                id: exchangeId,
                portfolio: {
                    userId: selectedUser.id,
                },
            },
        });

        if (!exchange) {
            console.error(`[getMaxBorrowableAction] Exchange not found: ${exchangeId}`);
            return {
                success: false,
                error: "Exchange not found or access denied",
            };
        }

        // Create Binance margin client
        const client = createMarginClient({
            apiKey: exchange.apiKey,
            apiSecret: exchange.apiSecret,
        });

        // Get max borrowable from Binance
        const result = await getMaxBorrowable(client, asset);
        console.log(`[getMaxBorrowableAction] Binance result for ${asset}:`, result);

        if (!result.success || !result.data) {
            return {
                success: false,
                error: result.error || "Failed to fetch max borrowable",
            };
        }

        return successResult(result.data);
    } catch (error) {
        return handleServerError(error, "Failed to fetch max borrowable");
    }
});
