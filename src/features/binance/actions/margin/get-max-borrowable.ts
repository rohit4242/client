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

const GetMaxBorrowableInputSchema = z.object({
    exchangeId: z.string().uuid(),
    asset: z.string().min(2).max(10),
});

export const getMaxBorrowableAction = cache(async (
    input: unknown
): Promise<ServerActionResult<{ amount: number; asset: string }>> => {
    try {
        const session = await requireAuth();

        // Validate input
        const validated = GetMaxBorrowableInputSchema.parse(input);
        const { exchangeId, asset } = validated;

        // Get user's exchange
        const exchange = await db.exchange.findFirst({
            where: {
                id: exchangeId,
                portfolio: {
                    userId: session.id,
                },
            },
        });

        if (!exchange) {
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
