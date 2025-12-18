/**
 * Delete Signal Server Action
 * 
 * Deletes a trading signal.
 */

"use server";

import db from "@/db";
import { getUserWithRole } from "@/lib/auth-utils";
import {
    DeleteSignalInputSchema,
    type DeleteSignalInput
} from "../schemas/bot.schema";
import { revalidatePath } from "next/cache";

/**
 * Delete a signal
 */
export async function deleteSignal(
    input: DeleteSignalInput
): Promise<{ success: boolean; error?: string }> {
    try {
        const user = await getUserWithRole();
        if (!user || user.role !== "ADMIN") {
            throw new Error("Unauthorized: Admin access required");
        }

        const validatedData = DeleteSignalInputSchema.safeParse(input);
        if (!validatedData.success) {
            throw new Error("Invalid signal ID");
        }

        const { id } = validatedData.data;

        await db.signal.delete({
            where: { id }
        });

        revalidatePath("/(admin)/signal-bot", "page");

        return {
            success: true
        };

    } catch (error) {
        console.error("Error deleting signal:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to delete signal"
        };
    }
}
