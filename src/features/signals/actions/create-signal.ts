"use server";

import { isAdmin } from "@/lib/auth-utils";
import db from "@/db";
import { revalidatePath } from "next/cache";
import { CreateSignalInputSchema } from "../schemas/signal.schema";
import { z } from "zod";

export async function createSignal(input: z.infer<typeof CreateSignalInputSchema>) {
    try {
        const admin = await isAdmin();
        if (!admin) {
            return { success: false, error: "Unauthorized: Admin access required" };
        }

        // Validate input
        const validated = CreateSignalInputSchema.safeParse(input);
        if (!validated.success) {
            return {
                success: false,
                error: `Invalid input: ${validated.error.issues.map(i => i.message).join(", ")}`
            };
        }

        const data = validated.data;

        // Create the signal
        const signal = await db.signal.create({
            data: {
                botId: data.botId,
                action: data.action,
                symbol: data.symbol,
                price: data.price ?? null,
                message: data.message ?? "Manual signal triggered from Admin UI",
                processed: false,
                visibleToCustomer: true,
            },
        });

        revalidatePath("/(admin)/signals", "page");

        return { success: true, signalId: signal.id };
    } catch (error) {
        console.error("Error creating signal:", error);
        return { success: false, error: "Failed to create signal" };
    }
}
