/**
 * Delete Bot Server Action
 * 
 * Securely deletes a signal bot.
 */

"use server";

import { db } from "@/lib/db/client";
import { getUserWithRole } from "@/lib/auth-utils";
import { revalidatePath } from "next/cache";
import { DeleteBotInputSchema, type DeleteBotInput } from "../schemas/bot.schema";

/**
 * Delete a signal bot
 */
export async function deleteBot(input: DeleteBotInput) {
    try {
        const user = await getUserWithRole();
        if (!user) throw new Error("Unauthorized");

        // Validate input
        const validated = DeleteBotInputSchema.parse(input);
        const { id } = validated;

        // Verify bot belongs to user or admin is authorized
        const bot = await db.bot.findUnique({
            where: { id },
            include: { portfolio: true }
        });

        if (!bot) {
            return { success: false, error: "Bot not found" };
        }

        // Only owner or admin can delete
        if (bot.portfolio.userId !== user.id && user.role !== "ADMIN") {
            return { success: false, error: "Unauthorized" };
        }

        // We use a transaction to ensure all related data is handled if needed
        // For now, simple delete (if there are complex relations, we might need more)
        await db.bot.delete({
            where: { id },
        });

        // Revalidate paths
        revalidatePath("/(admin)/signal-bot", "page");
        revalidatePath("/agent/signal-bot", "page");

        return { success: true };
    } catch (error) {
        console.error("Error deleting bot:", error);
        return { success: false, error: "Failed to delete bot. Ensure it has no active positions." };
    }
}
