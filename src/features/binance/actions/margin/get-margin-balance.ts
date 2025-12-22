/**
 * Get Margin Balance Server Action
 * 
 * Fetches margin account balance from Binance.
 */

"use server";

import { cache } from "react";
import { db } from "@/lib/db/client";
import { handleServerError, successResult, ServerActionResult } from "@/lib/validation/error-handler";
import { GetMarginBalanceInputSchema, type MarginBalanceResult } from "../../schemas/balance.schema";
import { createMarginClient, getMarginAccount } from "../../sdk";

export const getMarginBalanceAction = cache(async (
    input: unknown
): Promise<ServerActionResult<MarginBalanceResult>> => {
    try {
        // Validate input
        const validated = GetMarginBalanceInputSchema.parse(input);
        const { exchangeId, userId } = validated;

        // Get user's exchange
        const exchange = await db.exchange.findFirst({
            where: {
                id: exchangeId,
                portfolioId: userId,
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

        // Get margin account info from Binance
        const result = await getMarginAccount(client);

        if (!result.success || !result.data) {
            return {
                success: false,
                error: result.error || "Failed to fetch margin balance",
            };
        }

        return successResult(result.data);
    } catch (error) {
        return handleServerError(error, "Failed to fetch margin balance");
    }
});
