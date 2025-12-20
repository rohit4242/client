"use server";

import db from "@/db";
import { isAdmin } from "@/lib/auth-utils";
import { revalidatePath } from "next/cache";
import { UpdateSignalInputSchema } from "../schemas/signal.schema";
import { z } from "zod";

/**
 * Update a signal (Admin action)
 */
export async function updateSignal(input: z.infer<typeof UpdateSignalInputSchema>) {
    try {
        const admin = await isAdmin();
        if (!admin) throw new Error("Unauthorized: Admin access required");

        const validatedData = UpdateSignalInputSchema.parse(input);
        const { id, ...data } = validatedData;

        const updatedSignal = await db.signal.update({
            where: { id },
            data: {
                ...data,
                updatedAt: new Date(),
            },
        });

        revalidatePath("/(admin)/signals", "page");

        return { success: true, signal: updatedSignal };
    } catch (error) {
        console.error("Error updating signal:", error);
        return { success: false, error: "Failed to update signal" };
    }
}
