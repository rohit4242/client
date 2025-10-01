"use server";

import { getUserWithRole } from "@/lib/auth-utils";
import db from "@/db";

export interface RecentSignal {
  id: string;
  action: string;
  symbol: string;
  price: number | null;
  message: string | null;
  processed: boolean;
  error: string | null;
  createdAt: string;
  botName: string;
}

export async function getRecentSignals(limit: number = 10): Promise<RecentSignal[]> {
  try {
    const user = await getUserWithRole();

    if (!user) {
      throw new Error("Unauthorized");
    }

    // Get user's portfolio
    const portfolio = await db.portfolio.findFirst({
      where: {
        userId: user.id,
      },
    });

    if (!portfolio) {
      return [];
    }

    // Get signals from user's bots
    const signals = await db.signal.findMany({
      where: {
        bot: {
          portfolioId: portfolio.id,
        },
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
      take: limit,
    });

    return signals.map((signal) => ({
      id: signal.id,
      action: signal.action,
      symbol: signal.symbol,
      price: signal.price,
      message: signal.message,
      processed: signal.processed,
      error: signal.error,
      createdAt: signal.createdAt.toISOString(),
      botName: signal.bot.name,
    }));
  } catch (error) {
    console.error("Error fetching recent signals:", error);
    return [];
  }
}

