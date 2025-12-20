"use server";

import { isAdmin } from "@/lib/auth-utils";
import db from "@/db";
import { revalidatePath } from "next/cache";
import { CreateSignalInputSchema } from "../schemas/signal.schema";
import { z } from "zod";

const BulkCreateSignalsInputSchema = z.object({
    signals: z.array(CreateSignalInputSchema),
});

export async function bulkCreateSignals(input: z.infer<typeof BulkCreateSignalsInputSchema>) {
    try {
        const admin = await isAdmin();
        if (!admin) {
            return { success: false, error: "Unauthorized: Admin access required" };
        }

        // Validate input
        const validated = BulkCreateSignalsInputSchema.safeParse(input);
        if (!validated.success) {
            return {
                success: false,
                error: `Invalid input: ${validated.error.issues.map(i => i.message).join(", ")}`
            };
        }

        const { signals } = validated.data;

        // Use a transaction for bulk creation
        const result = await db.$transaction(async (tx) => {
            const created = [];
            const failed = [];
            const errors = [];

            for (let i = 0; i < signals.length; i++) {
                const signalData = signals[i];
                try {
                    const signal = await tx.signal.create({
                        data: {
                            botId: signalData.botId,
                            action: signalData.action,
                            symbol: signalData.symbol,
                            price: signalData.price ?? null,
                            message: signalData.message ?? "Bulk upload from Admin UI",
                            processed: false,
                            visibleToCustomer: signalData.visibleToCustomer ?? true,
                        },
                    });
                    created.push(signal.id);
                } catch (error) {
                    console.error(`Error creating signal at index ${i}:`, error);
                    failed.push(i + 1);
                    errors.push({
                        row: i + 1,
                        error: error instanceof Error ? error.message : "Database error"
                    });
                }
            }

            return {
                created: created.length,
                failed: failed.length,
                errors
            };
        });

        revalidatePath("/(admin)/signals", "page");

        return { success: true, ...result };
    } catch (error) {
        console.error("Error bulk creating signals:", error);
        return { success: false, error: "Failed to bulk create signals" };
    }
}
