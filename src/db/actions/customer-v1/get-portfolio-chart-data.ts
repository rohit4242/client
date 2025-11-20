"use server";

import db from "@/db";

export interface EnhancedChartDataPoint {
  date: string;
  value: number;
  pnl: number;
  periodPnl: number;
  trades: number;
}

export async function getPortfolioChartDataCustomerV1(
  userId: string,
  period: "1D" | "1W" | "1M" = "1W"
): Promise<EnhancedChartDataPoint[]> {
  try {
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
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (!portfolio) {
      return [];
    }

    // Calculate date range and granularity based on period
    const endDate = new Date();
    const startDate = new Date();
    let isHourly = false;

    switch (period) {
      case "1D":
        startDate.setHours(startDate.getHours() - 24);
        isHourly = true;
        break;
      case "1W":
        startDate.setDate(startDate.getDate() - 7);
        break;
      case "1M":
        startDate.setDate(startDate.getDate() - 30);
        break;
    }

    // Get all positions that have been updated (closed) within the date range
    // Include positions that were created before the range but closed during it
    const relevantPositions = portfolio.positions.filter(
      (p) => p.updatedAt >= startDate && p.updatedAt <= endDate && p.status === "CLOSED"
    );

    // Calculate initial balance (balance at start of period)
    // This is the portfolio initial balance plus all PnL from positions closed before the start date
    const positionsBeforeStart = portfolio.positions.filter(
      (p) => p.updatedAt < startDate && p.status === "CLOSED"
    );
    const pnlBeforeStart = positionsBeforeStart.reduce((sum, p) => sum + p.pnl, 0);
    const initialBalance = portfolio.initialBalance + pnlBeforeStart;

    // Create time buckets based on granularity
    const timeBuckets = new Map<string, { pnl: number; trades: number }>();

    // Function to get bucket key for a date
    const getBucketKey = (date: Date): string => {
      if (isHourly) {
        // For hourly: "2024-11-20T14:00:00"
        const d = new Date(date);
        d.setMinutes(0, 0, 0);
        return d.toISOString();
      } else {
        // For daily: "2024-11-20"
        return date.toISOString().split("T")[0];
      }
    };

    // Populate time buckets with position data
    relevantPositions.forEach((position) => {
      const bucketKey = getBucketKey(position.updatedAt);
      
      if (!timeBuckets.has(bucketKey)) {
        timeBuckets.set(bucketKey, { pnl: 0, trades: 0 });
      }
      
      const bucket = timeBuckets.get(bucketKey)!;
      bucket.pnl += position.pnl;
      bucket.trades += 1;
    });

    // Generate chart data points
    const chartData: EnhancedChartDataPoint[] = [];
    const currentDate = new Date(startDate);
    let cumulativePnl = 0;

    while (currentDate <= endDate) {
      const bucketKey = getBucketKey(currentDate);
      const bucket = timeBuckets.get(bucketKey);

      // Period PnL and trades for this time bucket
      const periodPnl = bucket ? bucket.pnl : 0;
      const trades = bucket ? bucket.trades : 0;

      // Update cumulative PnL
      cumulativePnl += periodPnl;

      chartData.push({
        date: bucketKey,
        value: initialBalance + cumulativePnl,
        pnl: cumulativePnl,
        periodPnl: periodPnl,
        trades: trades,
      });

      // Move to next time bucket
      if (isHourly) {
        currentDate.setHours(currentDate.getHours() + 1);
      } else {
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    return chartData;
  } catch (error) {
    console.error("Error fetching portfolio chart data (customer v1):", error);
    return [];
  }
}


