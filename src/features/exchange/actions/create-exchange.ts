/**
 * Create Exchange Server Action
 * 
 * Creates a new exchange connection with Binance API validation.
 */

"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import { requireAuth } from "@/lib/auth/session";
import { handleServerError, successResult, ServerActionResult } from "@/lib/validation/error-handler";
import { CreateExchangeInputSchema, toExchangeClient, type CreateExchangeInput, type ExchangeClient } from "../schemas/exchange.schema";
import { Spot } from "@binance/spot";
import { getSelectedUser } from "@/lib/selected-user-server";

/**
 * Validate Binance API credentials
 */
async function validateBinanceCredentials(apiKey: string, apiSecret: string) {
    const client = new Spot({
        configurationRestAPI: { apiKey, apiSecret },
    });

    // Test credentials by fetching account info
    const accountResponse = await client.restAPI.getAccount();

    if (!accountResponse || typeof accountResponse !== "object") {
        throw new Error("Invalid API credentials - Authentication failed");
    }

    return accountResponse;
}

/**
 * Calculate total USD value from Binance account
 */
async function calculateTotalUSDValue(apiKey: string, apiSecret: string) {
    const { calculateTotalUSDValue: calcValue } = await import("@/lib/trading-utils");
    return calcValue({ apiKey, apiSecret });
}

/**
 * Create new exchange
 */
export async function createExchange(
    input: CreateExchangeInput
): Promise<ServerActionResult<ExchangeClient>> {
    try {
        const selectedUser = await getSelectedUser();

        if (!selectedUser) {
            return {
                success: false,
                error: "Selected user not found",
            };
        }


        // Validate input
        const validated = CreateExchangeInputSchema.parse(input);
        const { name, apiKey, apiSecret, positionMode, userId } = validated;

        // Use userId from selected user if provided (admin creating for customer)
        const targetUserId = userId || selectedUser.id;

        // Check if exchange already exists
        const existingExchange = await db.exchange.findFirst({
            where: { apiKey },
        });

        if (existingExchange) {
            return {
                success: false,
                error: "An exchange with this API key already exists",
            };
        }

        // Validate Binance credentials
        await validateBinanceCredentials(apiKey, apiSecret);

        // Calculate portfolio values
        const { spotValue, marginValue, totalValue } = await calculateTotalUSDValue(apiKey, apiSecret);

        // Find or create portfolio
        let portfolio = await db.portfolio.findFirst({
            where: { userId: targetUserId },
        });

        if (!portfolio) {
            portfolio = await db.portfolio.create({
                data: {
                    userId: targetUserId,
                    name: name,
                },
            });
        }

        // Create exchange
        const exchange = await db.exchange.create({
            data: {
                portfolioId: portfolio.id,
                name,
                apiKey,
                apiSecret,
                positionMode,
                isActive: true,
                spotValue,
                marginValue,
                totalValue,
            },
        });

        // Sync portfolio balance
        try {
            const { syncPortfolioBalance } = await import("@/db/actions/admin/sync-portfolio-balance");
            await syncPortfolioBalance(targetUserId);
        } catch (syncError) {
            console.error("Error syncing portfolio balance:", syncError);
            // Don't fail exchange creation if sync fails
        }

        // Revalidate paths
        revalidatePath("/exchanges");
        revalidatePath("/(admin)", "layout");

        return successResult(toExchangeClient(exchange));
    } catch (error) {
        return handleServerError(error, "Failed to create exchange");
    }
}
