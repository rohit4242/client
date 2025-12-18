/**
 * Create Signal Server Action
 * 
 * Manually creates a trading signal.
 */

"use server";

import db from "@/db";
import { getUserWithRole } from "@/lib/auth-utils";
import {
    CreateSignalInputSchema,
    type CreateSignalInput,
    type SignalClient,
    toSignalClient
} from "../schemas/bot.schema";
import { revalidatePath } from "next/cache";

/**
 * Create a manual signal
 */
export async function createSignal(
    input: CreateSignalInput
): Promise<{ success: boolean; signal?: SignalClient; error?: string }> {
    try {
        const user = await getUserWithRole();
        if (!user || user.role !== "ADMIN") {
            throw new Error("Unauthorized: Admin access required");
        }

        const validatedData = CreateSignalInputSchema.safeParse(input);
        if (!validatedData.success) {
            throw new Error(`Invalid input: ${validatedData.error.issues.map(e => e.message).join(", ")}`);
        }

        const { botId, action, symbol, price, message } = validatedData.data;

        // Verify bot exists
        const bot = await db.bot.findUnique({
            where: { id: botId }
        });

        if (!bot) throw new Error("Bot not found");

        const signal = await db.signal.create({
            data: {
                botId,
                action,
                symbol: symbol.toUpperCase(),
                price: price ?? null,
                message: message ?? null,
                visibleToCustomer: true,
            }
        });

        revalidatePath("/(admin)/signal-bot", "page");

        return {
            success: true,
            signal: toSignalClient(signal as any)
        };

    } catch (error) {
        console.error("Error creating signal:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to create signal"
        };
    }
}
