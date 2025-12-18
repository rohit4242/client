/**
 * Get Symbol Info Server Action
 * 
 * Fetches detailed symbol information including filters.
 */

"use server";

import { cache } from "react";
import { db } from "@/lib/db/client";
import { requireAuth } from "@/lib/auth/session";
import { handleServerError, successResult, ServerActionResult } from "@/lib/validation/error-handler";
import { GetSymbolInfoInputSchema, type SymbolInfo } from "../../schemas/market.schema";
import { createSpotClient, getSymbolInfo } from "../../sdk";

export const getSymbolInfoAction = cache(async (
    input: unknown
): Promise<ServerActionResult<SymbolInfo>> => {
    try {
        const session = await requireAuth();

        // Validate input
        const validated = GetSymbolInfoInputSchema.parse(input);
        const { exchangeId, symbol } = validated;

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

        // Create Binance client
        const client = createSpotClient({
            apiKey: exchange.apiKey,
            apiSecret: exchange.apiSecret,
        });

        // Get symbol info from Binance
        const result = await getSymbolInfo(client, symbol);

        if (!result.success || !result.data) {
            return {
                success: false,
                error: result.error || "Failed to fetch symbol info",
            };
        }

        return successResult(result.data);
    } catch (error) {
        return handleServerError(error, "Failed to fetch symbol info");
    }
});
