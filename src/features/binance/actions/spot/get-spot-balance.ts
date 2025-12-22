/**
 * Get Spot Balance Server Action
 * 
 * Fetches spot account balance from Binance.
 */

"use server";

import { cache } from "react";
import { db } from "@/lib/db/client";
import { handleServerError, successResult, ServerActionResult } from "@/lib/validation/error-handler";
import { GetSpotBalanceInputSchema, type SpotBalanceResult } from "../../schemas/balance.schema";
import { createSpotClient, getSpotBalance } from "../../sdk";

export const getSpotBalanceAction = cache(async (
    input: unknown
): Promise<ServerActionResult<SpotBalanceResult>> => {
    try {

        // Validate input
        const validated = GetSpotBalanceInputSchema.parse(input);
        const { exchangeId, userId } = validated

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

        // Create Binance client
        const client = createSpotClient({
            apiKey: exchange.apiKey,
            apiSecret: exchange.apiSecret,
        });

        console.log("befor", exchange)
        // Get balance from Binance
        const result = await getSpotBalance(client);

        console.log("after", result)

        if (!result.success || !result.data) {
            return {
                success: false,
                error: result.error || "Failed to fetch balance",
            };
        }

        // Calculate totals (simplified - would need price data for accurate conversion)
        const totalBTC = 0; // TODO: Calculate from balances
        const totalUSDT = parseFloat(
            result.data.balances.find((b) => b.asset === "USDT")?.free || "0"
        );

        return successResult({
            balances: result.data.balances,
            totalBTC,
            totalUSDT,
        });
    } catch (error) {
        return handleServerError(error, "Failed to fetch spot balance");
    }
});
