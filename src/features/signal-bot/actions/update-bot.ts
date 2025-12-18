/**
 * Update Bot Server Action
 * 
 * Updates an existing signal bot configuration.
 */

"use server";

import { db } from "@/lib/db/client";
import { getUserWithRole } from "@/lib/auth-utils";
import { revalidatePath } from "next/cache";
import { UpdateBotInputSchema, type UpdateBotInput } from "../schemas/bot.schema";

/**
 * Update a signal bot
 */
export async function updateBot(input: UpdateBotInput) {
    try {
        const user = await getUserWithRole();
        if (!user) throw new Error("Unauthorized");

        // Validate input
        const validated = UpdateBotInputSchema.parse(input);
        const { id, ...data } = validated;

        // Verify bot ownership
        const bot = await db.bot.findUnique({
            where: { id },
            include: { portfolio: true }
        });

        if (!bot) {
            return { success: false, error: "Bot not found" };
        }

        // Only owner or admin can update
        if (bot.portfolio.userId !== user.id && user.role !== "ADMIN") {
            return { success: false, error: "Unauthorized" };
        }

        const updatedBot = await db.bot.update({
            where: { id },
            data: {
                ...data,
                // Ensure certain fields are not overwritten if not provided
                updatedAt: new Date(),
            },
        });

        // Revalidate paths
        revalidatePath("/(admin)/signal-bot", "page");
        revalidatePath("/agent/signal-bot", "page");

        return { success: true, bot: updatedBot };
    } catch (error) {
        console.error("Error updating bot:", error);
        return { success: false, error: "Failed to update signal bot" };
    }
}
