/**
 * Sync Exchange Server Action
 * 
 * Syncs exchange balance with Binance.
 */

"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import { requireAuth } from "@/lib/auth/session";
import { handleServerError, successResult, assertExists, ServerActionResult } from "@/lib/validation/error-handler";
import { SyncExchangeInputSchema, type SyncExchangeInput, type SyncExchangeResult } from "../schemas/exchange.schema";

/**
 * Calculate total USD value from Binance account
 */
async function calculateTotalUSDValue(apiKey: string, apiSecret: string) {
    const { calculateTotalUSDValue: calcValue } = await import("@/lib/trading-utils");
    return calcValue({ apiKey, apiSecret });
}

/**
 * Sync exchange balance with Binance
 */
export async function syncExchange(
    input: SyncExchangeInput
): Promise<ServerActionResult<SyncExchangeResult>> {
    try {
        const session = await requireAuth();

        // Validate input
        const validated = SyncExchangeInputSchema.parse(input);
        const { id } = validated;

        // Verify ownership and active status
        const exchange = await db.exchange.findFirst({
            where: {
                id,
                portfolio: {
                    userId: session.id,
                },
            },
        });

        assertExists(exchange, "Exchange not found");

        if (!exchange.isActive) {
            return {
                success: false,
                error: "Cannot sync inactive exchange",
            };
        }

        // Calculate portfolio values from Binance
        const { spotValue, marginValue, totalValue } = await calculateTotalUSDValue(
            exchange.apiKey,
            exchange.apiSecret
        );

        // Update exchange
        await db.exchange.update({
            where: { id },
            data: {
                spotValue,
                marginValue,
                totalValue,
                lastSyncedAt: new Date(),
            },
        });

        // Revalidate paths
        revalidatePath("/exchanges");

        return successResult({
            spotValue,
            marginValue,
            totalValue,
            lastSyncedAt: new Date().toISOString(),
        });
    } catch (error) {
        return handleServerError(error, "Failed to sync exchange");
    }
}
