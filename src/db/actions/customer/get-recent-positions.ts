"use server";

import { getUserWithRole } from "@/lib/auth-utils";
import db from "@/db";

export interface RecentPosition {
  id: string;
  symbol: string;
  side: string;
  type: string;
  entryPrice: number;
  quantity: number;
  currentPrice: number | null;
  status: string;
  pnl: number;
  pnlPercent: number;
  source: string;
  createdAt: string;
  updatedAt: string;
}

export async function getRecentPositions(limit: number = 10): Promise<RecentPosition[]> {
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

    // Get recent positions
    const positions = await db.position.findMany({
      where: {
        portfolioId: portfolio.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    });

    return positions.map((position) => ({
      id: position.id,
      symbol: position.symbol,
      side: position.side,
      type: position.type,
      entryPrice: position.entryPrice,
      quantity: position.quantity,
      currentPrice: position.currentPrice,
      status: position.status,
      pnl: position.pnl,
      pnlPercent: position.pnlPercent,
      source: position.source,
      createdAt: position.createdAt.toISOString(),
      updatedAt: position.updatedAt.toISOString(),
    }));
  } catch (error) {
    console.error("Error fetching recent positions:", error);
    return [];
  }
}

