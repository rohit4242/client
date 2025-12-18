/**
 * Create Bulk Signals Server Action
 * 
 * Creates multiple signals at once for a specific user.
 */

"use server";

import { db } from "@/lib/db/client";
import { getUserWithRole } from "@/lib/auth-utils";
import {
    CreateBulkSignalsInputSchema,
    type CreateBulkSignalsInput,
    type CreateBulkSignalsResult
} from "../schemas/bot.schema";

/**
 * Create bulk signals
 * Restricted to admins
 */
export async function createBulkSignals(
    input: CreateBulkSignalsInput
): Promise<CreateBulkSignalsResult> {
    try {
        const user = await getUserWithRole();
        if (!user || user.role !== "ADMIN") {
            throw new Error("Unauthorized: Admin access required");
        }

        // Validate input
        const validatedData = CreateBulkSignalsInputSchema.safeParse(input);
        if (!validatedData.success) {
            throw new Error(`Invalid input: ${validatedData.error.issues.map(e => e.message).join(", ")}`);
        }

        const { userId, signals } = validatedData.data;

        // Get user's portfolio
        const portfolio = await db.portfolio.findFirst({
            where: { userId },
        });

        if (!portfolio) {
            throw new Error("User portfolio not found");
        }

        let createdCount = 0;
        let failedCount = 0;
        const errors: Array<{ row: number; error: string }> = [];

        // Process each signal
        for (let i = 0; i < signals.length; i++) {
            const signal = signals[i];
            const rowNumber = i + 1;

            try {
                // Verify bot belongs to this user's portfolio
                const bot = await db.bot.findFirst({
                    where: {
                        id: signal.botId,
                        portfolioId: portfolio.id,
                    },
                });

                if (!bot) {
                    failedCount++;
                    errors.push({
                        row: rowNumber,
                        error: "Bot not found or does not belong to this user",
                    });
                    continue;
                }

                // Create the signal
                await db.signal.create({
                    data: {
                        botId: signal.botId,
                        action: signal.action,
                        symbol: signal.symbol,
                        price: signal.price ?? null,
                        message: signal.message ?? null,
                        processed: false,
                        visibleToCustomer: true,
                    },
                });

                createdCount++;
            } catch (error) {
                failedCount++;
                errors.push({
                    row: rowNumber,
                    error: error instanceof Error ? error.message : "Failed to create signal",
                });
                console.error(`Error creating signal for row ${rowNumber}:`, error);
            }
        }

        return {
            success: true,
            created: createdCount,
            failed: failedCount,
            errors,
        };
    } catch (error) {
        console.error("Error creating bulk signals:", error);
        return {
            success: false,
            created: 0,
            failed: input.signals.length,
            errors: [{ row: 0, error: error instanceof Error ? error.message : "Failed to process bulk signals" }],
        };
    }
}
