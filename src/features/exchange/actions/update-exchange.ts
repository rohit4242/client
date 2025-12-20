/**
 * Update Exchange Server Action
 * 
 * Updates an existing exchange.
 */

"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import { requireAuth } from "@/lib/auth/session";
import { handleServerError, successResult, assertExists, ServerActionResult } from "@/lib/validation/error-handler";
import { UpdateExchangeInputSchema, toExchangeClient, type UpdateExchangeInput, type ExchangeClient } from "../schemas/exchange.schema";

/**
 * Update exchange
 */
export async function updateExchange(
    input: UpdateExchangeInput
): Promise<ServerActionResult<ExchangeClient>> {
    try {

        // Validate input
        const validated = UpdateExchangeInputSchema.parse(input);
        const { id, userId, ...updateData } = validated;

        // Verify ownership
        const existingExchange = await db.exchange.findFirst({
            where: {
                id,
                portfolio: {
                    userId,
                },
            },
        });

        assertExists(existingExchange, "Exchange not found");

        // Update exchange
        const exchange = await db.exchange.update({
            where: { id },
            data: updateData,
        });

        // Revalidate paths
        revalidatePath("/exchanges");

        return successResult(toExchangeClient(exchange));
    } catch (error) {
        return handleServerError(error, "Failed to update exchange");
    }
}
