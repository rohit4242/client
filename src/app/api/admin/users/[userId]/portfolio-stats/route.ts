import { NextRequest, NextResponse } from "next/server";
import { isAdmin, isAgent } from "@/lib/auth-utils";
import db from "@/db";

interface RouteParams {
    params: Promise<{
        userId: string;
    }>;
}

/**
 * GET /api/admin/users/[userId]/portfolio-stats
 * Get portfolio statistics for a specific user (admin/agent only)
 */
export async function GET(
    request: NextRequest,
    { params }: RouteParams
) {
    try {
        const admin = await isAdmin();
        const agent = await isAgent();

        if (!admin && !agent) {
            return NextResponse.json(
                { error: "Unauthorized: Admin or Agent access required" },
                { status: 403 }
            );
        }

        const { userId } = await params;

        if (!userId) {
            return NextResponse.json(
                { error: "User ID is required" },
                { status: 400 }
            );
        }

        // Get user's portfolio with stats
        const portfolio = await db.portfolio.findFirst({
            where: {
                userId,
            },
            select: {
                id: true,
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
            return NextResponse.json(
                { success: false, message: "Portfolio not found", stats: null },
                { status: 200 }
            );
        }

        return NextResponse.json({
            success: true,
            stats: {
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
                lastCalculatedAt: portfolio.lastCalculatedAt?.toISOString(),
            },
        });
    } catch (error) {
        console.error("Error fetching portfolio stats:", error);
        return NextResponse.json(
            { error: "Failed to fetch portfolio stats" },
            { status: 500 }
        );
    }
}
