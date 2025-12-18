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
    params: RouteParams
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

        const { userId } = await params.params;

        if (!userId) {
            return NextResponse.json(
                { error: "User ID is required" },
                { status: 400 }
            );
        }

        // Parse query params for date filtering
        const searchParams = request.nextUrl.searchParams;
        const fromDate = searchParams.get("from");
        const toDate = searchParams.get("to");

        let dateFilter = {};
        if (fromDate && toDate) {
            dateFilter = {
                closedAt: {
                    gte: new Date(fromDate),
                    lte: new Date(toDate),
                },
            };
        }

        // Get user's portfolio
        const portfolio = await db.portfolio.findFirst({
            where: {
                userId,
            },
        });

        if (!portfolio) {
            return NextResponse.json(
                { success: false, message: "Portfolio not found", stats: null },
                { status: 200 }
            );
        }

        let periodStats = {};

        // If date filter is active, calculate stats from closed positions
        if (fromDate && toDate) {
            const closedPositions = await db.position.findMany({
                where: {
                    portfolioId: portfolio.id,
                    status: "CLOSED",
                    ...dateFilter,
                },
                select: {
                    pnl: true,
                    pnlPercent: true,
                },
            });

            // Calculate Period PnL
            const periodPnl = closedPositions.reduce((sum, pos) => sum + (pos.pnl || 0), 0);

            // Calculate Win Rate for period
            const totalClosed = closedPositions.length;
            const wins = closedPositions.filter(p => (p.pnl || 0) > 0).length;
            const winRate = totalClosed > 0 ? (wins / totalClosed) * 100 : 0;

            // Calculate active trades (always current)
            const activeTrades = await db.position.count({
                where: {
                    portfolioId: portfolio.id,
                    status: "OPEN",
                },
            });

            // Calculate Period PnL Percent (Use a simple sum of percents or relative to balance)
            // Sum of pnlPercent is one way, but inaccurate.
            // Better: Period PnL / Current Balance * 100 (Simplified ROI)
            // combine the spot and margin balance to get the total balance
            const currentBalance = portfolio.spotBalance + portfolio.marginBalance || 1; // avoid divide by zero
            const periodPnlPercent = (periodPnl / currentBalance) * 100;

            periodStats = {
                // Include standard stats first
                ...portfolio,
                // Overwrite with calculated period stats
                periodPnl,
                periodPnlPercent,
                winRate,
                activeTrades,
                currentBalance,
            };
        } else {
            // Use pre-calculated portfolio stats
            periodStats = { ...portfolio };
        }

        return NextResponse.json({
            success: true,
            stats: periodStats,
        });

    } catch (error) {
        console.error("Error fetching portfolio stats:", error);
        return NextResponse.json(
            { error: "Failed to fetch portfolio stats" },
            { status: 500 }
        );
    }
}
