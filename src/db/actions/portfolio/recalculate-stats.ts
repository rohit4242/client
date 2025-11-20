"use server";

import db from "@/db";

/**
 * Internal function to recalculate portfolio statistics
 * This version has NO admin check and is meant for internal system use only
 * Called automatically when positions are closed or updated
 */
export async function recalculatePortfolioStatsInternal(
  userId: string
): Promise<boolean> {
  try {
    if (!userId) {
      console.error("recalculatePortfolioStatsInternal: userId is required");
      return false;
    }

    // Get user's portfolio
    const portfolio = await db.portfolio.findFirst({
      where: {
        userId,
      },
      include: {
        positions: {
          where: {
            status: {
              in: ["OPEN", "CLOSED"],
            },
          },
        },
        orders: true,
      },
    });

    if (!portfolio) {
      console.log(`No portfolio found for user ${userId}`);
      return false;
    }

    // Calculate statistics
    const closedPositions = portfolio.positions.filter((p) => p.status === "CLOSED");
    const openPositions = portfolio.positions.filter((p) => p.status === "OPEN");

    const totalWins = closedPositions.filter((p) => p.pnl > 0).length;
    const totalLosses = closedPositions.filter((p) => p.pnl < 0).length;
    const winRate = closedPositions.length > 0 
      ? (totalWins / closedPositions.length) * 100 
      : 0;

    const totalPnl = portfolio.positions.reduce((sum, p) => sum + p.pnl, 0);
    const totalValue = openPositions.reduce((sum, p) => sum + p.entryValue, 0);
    const totalPnlPercent = totalValue > 0 ? (totalPnl / totalValue) * 100 : 0;

    const wins = closedPositions.filter((p) => p.pnl > 0);
    const losses = closedPositions.filter((p) => p.pnl < 0);

    const avgWinAmount = wins.length > 0
      ? wins.reduce((sum, p) => sum + p.pnl, 0) / wins.length
      : 0;

    const avgLossAmount = losses.length > 0
      ? Math.abs(losses.reduce((sum, p) => sum + p.pnl, 0) / losses.length)
      : 0;

    const largestWin = wins.length > 0
      ? Math.max(...wins.map((p) => p.pnl))
      : 0;

    const largestLoss = losses.length > 0
      ? Math.abs(Math.min(...losses.map((p) => p.pnl)))
      : 0;

    const grossProfit = wins.reduce((sum, p) => sum + p.pnl, 0);
    const grossLoss = Math.abs(losses.reduce((sum, p) => sum + p.pnl, 0));
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : 0;

    // Calculate time-based P&L
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    const dailyPositions = portfolio.positions.filter(
      (p) => p.updatedAt >= today
    );
    const weeklyPositions = portfolio.positions.filter(
      (p) => p.updatedAt >= weekAgo
    );
    const monthlyPositions = portfolio.positions.filter(
      (p) => p.updatedAt >= monthAgo
    );

    const dailyPnl = dailyPositions.reduce((sum, p) => sum + p.pnl, 0);
    const weeklyPnl = weeklyPositions.reduce((sum, p) => sum + p.pnl, 0);
    const monthlyPnl = monthlyPositions.reduce((sum, p) => sum + p.pnl, 0);

    // Update portfolio statistics
    await db.portfolio.update({
      where: {
        id: portfolio.id,
      },
      data: {
        totalPnl,
        totalPnlPercent,
        totalWins,
        totalLosses,
        winRate,
        totalTrades: portfolio.positions.length,
        activeTrades: openPositions.length,
        avgWinAmount,
        avgLossAmount,
        largestWin,
        largestLoss,
        profitFactor,
        dailyPnl,
        weeklyPnl,
        monthlyPnl,
        currentBalance: portfolio.initialBalance + totalPnl,
        lastCalculatedAt: new Date(),
      },
    });

    console.log(`Portfolio stats recalculated successfully for user ${userId}`);
    return true;
  } catch (error) {
    console.error("Error recalculating portfolio stats (internal):", error);
    return false;
  }
}

