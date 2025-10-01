"use server";

import { getUserWithRole } from "@/lib/auth-utils";
import db from "@/db";

export interface PortfolioStats {
  totalPnl: number;
  totalPnlPercent: number;
  totalWins: number;
  totalLosses: number;
  winRate: number;
  currentBalance: number;
  initialBalance: number;
  totalTrades: number;
  activeTrades: number;
  dailyPnl: number;
  weeklyPnl: number;
  monthlyPnl: number;
  avgWinAmount: number;
  avgLossAmount: number;
  largestWin: number;
  largestLoss: number;
  profitFactor: number;
  lastCalculatedAt: string;
}

export async function getPortfolioStats(): Promise<PortfolioStats | null> {
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
      select: {
        totalPnl: true,
        totalPnlPercent: true,
        totalWins: true,
        totalLosses: true,
        winRate: true,
        currentBalance: true,
        initialBalance: true,
        totalTrades: true,
        activeTrades: true,
        dailyPnl: true,
        weeklyPnl: true,
        monthlyPnl: true,
        avgWinAmount: true,
        avgLossAmount: true,
        largestWin: true,
        largestLoss: true,
        profitFactor: true,
        lastCalculatedAt: true,
      },
    });

    if (!portfolio) {
      return null;
    }

    return {
      totalPnl: portfolio.totalPnl,
      totalPnlPercent: portfolio.totalPnlPercent,
      totalWins: portfolio.totalWins,
      totalLosses: portfolio.totalLosses,
      winRate: portfolio.winRate,
      currentBalance: portfolio.currentBalance,
      initialBalance: portfolio.initialBalance,
      totalTrades: portfolio.totalTrades,
      activeTrades: portfolio.activeTrades,
      dailyPnl: portfolio.dailyPnl,
      weeklyPnl: portfolio.weeklyPnl,
      monthlyPnl: portfolio.monthlyPnl,
      avgWinAmount: portfolio.avgWinAmount,
      avgLossAmount: portfolio.avgLossAmount,
      largestWin: portfolio.largestWin,
      largestLoss: portfolio.largestLoss,
      profitFactor: portfolio.profitFactor,
      lastCalculatedAt: portfolio.lastCalculatedAt.toISOString(),
    };
  } catch (error) {
    console.error("Error fetching portfolio stats:", error);
    return null;
  }
}

