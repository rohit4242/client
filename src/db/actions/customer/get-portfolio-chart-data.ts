"use server";

import { getUserWithRole } from "@/lib/auth-utils";
import db from "@/db";

export interface ChartDataPoint {
  date: string;
  value: number;
  pnl: number;
}

export async function getPortfolioChartData(
  period: "1M" | "3M" | "6M" | "1Y" | "ALL" = "1M"
): Promise<ChartDataPoint[]> {
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
      include: {
        positions: {
          where: {
            status: {
              in: ["OPEN", "CLOSED"],
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
        orders: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (!portfolio) {
      return [];
    }

    // Calculate date range based on period
    const endDate = new Date();
    const startDate = new Date();

    switch (period) {
      case "1M":
        startDate.setDate(startDate.getDate() - 30);
        break;
      case "3M":
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case "6M":
        startDate.setMonth(startDate.getMonth() - 6);
        break;
      case "1Y":
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      case "ALL":
        startDate.setFullYear(startDate.getFullYear() - 10); // Go back 10 years
        break;
    }

    // Filter positions within date range
    const positions = portfolio.positions.filter(
      (p) => p.createdAt >= startDate && p.createdAt <= endDate
    );

    // Group positions by date and calculate cumulative P&L
    const dateMap = new Map<string, { pnl: number; balance: number }>();
    let cumulativePnl = 0;

    // Initialize with starting balance
    const startDateStr = startDate.toISOString().split("T")[0];
    dateMap.set(startDateStr, {
      pnl: 0,
      balance: portfolio.initialBalance,
    });

    // Process each position
    positions.forEach((position) => {
      const dateStr = position.updatedAt.toISOString().split("T")[0];
      cumulativePnl += position.pnl;

      if (!dateMap.has(dateStr)) {
        dateMap.set(dateStr, {
          pnl: cumulativePnl,
          balance: portfolio.initialBalance + cumulativePnl,
        });
      } else {
        const existing = dateMap.get(dateStr)!;
        existing.pnl = cumulativePnl;
        existing.balance = portfolio.initialBalance + cumulativePnl;
      }
    });

    // Fill in missing dates with previous values
    const chartData: ChartDataPoint[] = [];
    const currentDate = new Date(startDate);
    let lastPnl = 0;
    let lastBalance = portfolio.initialBalance;

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split("T")[0];
      const dayData = dateMap.get(dateStr);

      if (dayData) {
        lastPnl = dayData.pnl;
        lastBalance = dayData.balance;
      }

      chartData.push({
        date: dateStr,
        value: lastBalance,
        pnl: lastPnl,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return chartData;
  } catch (error) {
    console.error("Error fetching portfolio chart data:", error);
    return [];
  }
}

