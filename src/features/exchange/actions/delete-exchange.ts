/**
 * Delete Exchange Server Action
 * 
 * Deletes an exchange connection.
 */

"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import { requireAuth } from "@/lib/auth/session";
import { handleServerError, successResult, assertExists, ServerActionResult } from "@/lib/validation/error-handler";
import { DeleteExchangeInputSchema, type DeleteExchangeInput } from "../schemas/exchange.schema";

/**
 * Delete exchange
 */
export async function deleteExchange(
    input: DeleteExchangeInput
): Promise<ServerActionResult<{ id: string }>> {
    try {
        const session = await requireAuth();

        // Validate input
        const validated = DeleteExchangeInputSchema.parse(input);
        const { id } = validated;

        // Verify ownership
        const existingExchange = await db.exchange.findFirst({
            where: {
                id,
                portfolio: {
                    userId: session.id,
                },
            },
        });

        assertExists(existingExchange, "Exchange not found");

        // Delete exchange (cascade will handle related data)
        await db.exchange.delete({
            where: { id },
        });

        // Revalidate paths
        revalidatePath("/exchanges");

        return successResult({ id });
    } catch (error) {
        return handleServerError(error, "Failed to delete exchange");
    }
}
