"use server";

import { isAdmin } from "@/lib/auth-utils";
import db from "@/db";
import { z } from "zod";

const createSignalSchema = z.object({
  botId: z.string().uuid(),
  action: z.enum(["ENTER_LONG", "EXIT_LONG", "ENTER_SHORT", "EXIT_SHORT"]),
  symbol: z.string().min(1),
  price: z.number().positive().nullable().optional(),
  message: z.string().nullable().optional(),
});

export async function createSignalForUser(
  userId: string,
  data: z.infer<typeof createSignalSchema>
): Promise<{ success: boolean; error?: string; signalId?: string }> {
  try {
    const admin = await isAdmin();

    if (!admin) {
      return { success: false, error: "Unauthorized: Admin access required" };
    }

    // Validate input
    const validatedData = createSignalSchema.safeParse(data);
    if (!validatedData.success) {
      return {
        success: false,
        error: `Invalid input: ${validatedData.error.issues.map((e) => e.message).join(", ")}`,
      };
    }

    // Get user's portfolio
    const portfolio = await db.portfolio.findFirst({
      where: { userId },
    });

    if (!portfolio) {
      return { success: false, error: "User portfolio not found" };
    }

    // Verify bot belongs to this user's portfolio
    const bot = await db.bot.findFirst({
      where: {
        id: validatedData.data.botId,
        portfolioId: portfolio.id,
      },
    });

    if (!bot) {
      return { success: false, error: "Bot not found or does not belong to this user" };
    }

    // Create the signal
    const signal = await db.signal.create({
      data: {
        botId: validatedData.data.botId,
        action: validatedData.data.action,
        symbol: validatedData.data.symbol,
        price: validatedData.data.price ?? null,
        message: validatedData.data.message ?? null,
        processed: false,
        visibleToCustomer: true,
      },
    });

    return { success: true, signalId: signal.id };
  } catch (error) {
    console.error("Error creating signal:", error);
    return { success: false, error: "Failed to create signal" };
  }
}

