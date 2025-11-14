"use server";

import { isAdmin } from "@/lib/auth-utils";
import db from "@/db";

export interface UserSignal {
  id: string;
  botId: string;
  botName: string;
  action: "ENTER_LONG" | "EXIT_LONG" | "ENTER_SHORT" | "EXIT_SHORT";
  symbol: string;
  price: number | null;
  message: string | null;
  processed: boolean;
  error: string | null;
  visibleToCustomer: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function getUserSignals(userId: string): Promise<UserSignal[]> {
  try {
    const admin = await isAdmin();

    if (!admin) {
      throw new Error("Unauthorized: Admin access required");
    }

    // Get user's portfolio
    const portfolio = await db.portfolio.findFirst({
      where: { userId },
    });

    if (!portfolio) {
      return [];
    }

    // Get all bots for this user's portfolio
    const bots = await db.bot.findMany({
      where: { portfolioId: portfolio.id },
      select: { id: true },
    });

    const botIds = bots.map((bot) => bot.id);

    if (botIds.length === 0) {
      return [];
    }

    // Get all signals for these bots
    const signals = await db.signal.findMany({
      where: {
        botId: { in: botIds },
      },
      include: {
        bot: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return signals.map((signal) => ({
      id: signal.id,
      botId: signal.botId,
      botName: signal.bot.name,
      action: signal.action as "ENTER_LONG" | "EXIT_LONG" | "ENTER_SHORT" | "EXIT_SHORT",
      symbol: signal.symbol,
      price: signal.price,
      message: signal.message,
      processed: signal.processed,
      error: signal.error,
      visibleToCustomer: signal.visibleToCustomer,
      createdAt: signal.createdAt.toISOString(),
      updatedAt: signal.updatedAt.toISOString(),
    }));
  } catch (error) {
    console.error("Error fetching user signals:", error);
    return [];
  }
}

