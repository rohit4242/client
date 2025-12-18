/**
 * Get Symbol Price Server Action
 * 
 * Fetches current price for a symbol from Binance.
 */

"use server";

import { cache } from "react";
import { db } from "@/lib/db/client";
import { requireAuth } from "@/lib/auth/session";
import { handleServerError, successResult, ServerActionResult } from "@/lib/validation/error-handler";
import { GetSymbolPriceInputSchema, type SymbolPrice } from "../../schemas/market.schema";
import { createSpotClient, getSymbolPrice } from "../../sdk";

export const getSymbolPriceAction = cache(async (
    input: unknown
): Promise<ServerActionResult<SymbolPrice>> => {
    try {
        const session = await requireAuth();

        // Validate input
        const validated = GetSymbolPriceInputSchema.parse(input);
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

        // Get price from Binance
        const result = await getSymbolPrice(client, symbol);

        if (!result.success || !result.data) {
            return {
                success: false,
                error: result.error || "Failed to fetch price",
            };
        }

        return successResult(result.data);
    } catch (error) {
        return handleServerError(error, "Failed to fetch symbol price");
    }
});
