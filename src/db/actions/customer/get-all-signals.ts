"use server";

import { getUserWithRole } from "@/lib/auth-utils";
import db from "@/db";

export interface CustomerSignal {
  id: string;
  action: string;
  symbol: string;
  price: number | null;
  message: string | null;
  processed: boolean;
  error: string | null;
  createdAt: string;
  updatedAt: string;
  botName: string;
  botId: string;
}

export async function getAllSignals(): Promise<CustomerSignal[]> {
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

    // Get signals from user's bots (only visible to customer)
    const signals = await db.signal.findMany({
      where: {
        bot: {
          portfolioId: portfolio.id,
        },
        visibleToCustomer: true,
      },
      include: {
        bot: {
          select: {
            id: true,
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
      action: signal.action,
      symbol: signal.symbol,
      price: signal.price,
      message: signal.message,
      processed: signal.processed,
      error: signal.error,
      createdAt: signal.createdAt.toISOString(),
      updatedAt: signal.updatedAt.toISOString(),
      botName: signal.bot.name,
      botId: signal.bot.id,
    }));
  } catch (error) {
    console.error("Error fetching all signals:", error);
    return [];
  }
}

