/**
 * Toggle Bot Server Action
 * 
 * Activates or deactivates a signal bot.
 */

"use server";

import { db } from "@/lib/db/client";
import { getUserWithRole } from "@/lib/auth-utils";
import { revalidatePath } from "next/cache";
import { ToggleBotInputSchema, type ToggleBotInput } from "../schemas/bot.schema";

/**
 * Toggle bot active status
 */
export async function toggleBot(input: ToggleBotInput) {
    try {
        const user = await getUserWithRole();
        if (!user) throw new Error("Unauthorized");

        // Validate input
        const validated = ToggleBotInputSchema.parse(input);
        const { id, isActive } = validated;

        // Verify bot belongs to user or admin is authorized
        // (Note: requireAuth ensures session, but we should verify ownership)
        const bot = await db.bot.findUnique({
            where: { id },
            include: { portfolio: true }
        });

        if (!bot) {
            return { success: false, error: "Bot not found" };
        }

        // Only owner or admin can toggle
        if (bot.portfolio.userId !== user.id && user.role !== "ADMIN") {
            return { success: false, error: "Unauthorized" };
        }

        const updatedBot = await db.bot.update({
            where: { id },
            data: { isActive },
        });

        // Revalidate paths that might show this bot
        revalidatePath("/(admin)/signal-bot", "page");
        revalidatePath("/agent/signal-bot", "page");

        return { success: true, bot: updatedBot };
    } catch (error) {
        console.error("Error toggling bot:", error);
        return { success: false, error: "Failed to toggle bot status" };
    }
}
