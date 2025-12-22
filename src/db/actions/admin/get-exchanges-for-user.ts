"use server";

import { isAdmin } from "@/lib/auth-utils";
import db from "@/db";
import { type ExchangeClient } from "@/features/exchange";

export async function getExchangesForUser(userId: string): Promise<ExchangeClient[]> {
  try {
    const admin = await isAdmin();

    if (!admin) {
      throw new Error("Unauthorized: Admin access required");
    }

    // Get user's portfolio
    const portfolio = await db.portfolio.findFirst({
      where: {
        userId,
      },
    });

    if (!portfolio) {
      return [];
    }

    const exchanges = await db.exchange.findMany({
      where: {
        portfolioId: portfolio.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Convert Decimal to number and Date to string for client compatibility
    const processedExchanges = exchanges.map((exchange) => ({
      ...exchange,
      totalValue: exchange.totalValue ? Number(exchange.totalValue) : null,
      lastSyncedAt: exchange.lastSyncedAt ? exchange.lastSyncedAt.toISOString() : null,
      createdAt: exchange.createdAt.toISOString(),
      updatedAt: exchange.updatedAt.toISOString(),
    }));

    return processedExchanges as ExchangeClient[];
  } catch (error) {
    console.error("Error fetching exchanges for user:", error);
    return [];
  }
}

