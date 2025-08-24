"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import db from "@/db";

export const getExchanges = async () => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      throw new Error("Unauthorized");
    }

    const exchanges = await db.exchange.findMany({
      where: {
        userId: session.user.id,
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
    
    return processedExchanges;
  } catch (error) {
    console.error("Error fetching exchanges:", error);
    return [];
  }
};
