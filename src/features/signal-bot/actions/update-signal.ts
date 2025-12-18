/**
 * Update Signal Server Action
 * 
 * Updates an individual signal's properties.
 */

"use server";

import { db } from "@/lib/db/client";
import { getUserWithRole } from "@/lib/auth-utils";
import { revalidatePath } from "next/cache";
import { Action } from "@prisma/client";

export interface UpdateSignalInput {
    id: string;
    action?: Action;
    symbol?: string;
    price?: number | null;
    message?: string | null;
    processed?: boolean;
    visibleToCustomer?: boolean;
}

/**
 * Update a signal
 */
export async function updateSignal(input: UpdateSignalInput) {
    try {
        const user = await getUserWithRole();
        if (!user) throw new Error("Unauthorized");

        const { id, ...data } = input;

        // Verify admin access (since this is typically an admin operation)
        if (user.role !== "ADMIN") {
            // Check if user owns the bot that owns the signal
            const signal = await db.signal.findUnique({
                where: { id },
                include: {
                    bot: {
                        include: { portfolio: true }
                    }
                }
            });

            if (!signal || signal.bot.portfolio.userId !== user.id) {
                return { success: false, error: "Unauthorized" };
            }
        }

        const updatedSignal = await db.signal.update({
            where: { id },
            data: {
                ...data,
                updatedAt: new Date(),
            },
        });

        // Revalidate paths
        revalidatePath("/(admin)/signal-bot", "page");

        return { success: true, signal: updatedSignal };
    } catch (error) {
        console.error("Error updating signal:", error);
        return { success: false, error: "Failed to update signal" };
    }
}
