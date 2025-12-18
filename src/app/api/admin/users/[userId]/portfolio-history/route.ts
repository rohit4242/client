import { NextRequest, NextResponse } from "next/server";
import { isAdmin, isAgent } from "@/lib/auth-utils";
import db from "@/db";

interface RouteParams {
    params: Promise<{
        userId: string;
    }>;
}

/**
 * GET /api/admin/users/[userId]/portfolio-history
 * Get portfolio value history for charts
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

        const searchParams = request.nextUrl.searchParams;
        const fromDateStr = searchParams.get("from");
        const toDateStr = searchParams.get("to");

        let fromDate = fromDateStr ? new Date(fromDateStr) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default 30 days
        const toDate = toDateStr ? new Date(toDateStr) : new Date();

        // Get user's portfolio
        const portfolio = await db.portfolio.findFirst({
            where: {
                userId,
            },
        });

        if (!portfolio) {
            return NextResponse.json({ history: [] });
        }

        // Fetch balance snapshots if available
        const snapshots = await db.balanceSnapshot.findMany({
            where: {
                portfolioId: portfolio.id,
                timestamp: {
                    gte: fromDate,
                    lte: toDate,
                },
            },
            orderBy: {
                timestamp: "asc",
            },
            select: {
                timestamp: true,
                totalValue: true,
                totalPnl: true,
            }
        });

        // Use transaction history if snapshots are sparse or empty? 
        // For now, rely on snapshots. If no snapshots, maybe return a single point or empty.
        // Or if we want to be fancy, we can calculate from transactions. 
        // Let's assume snapshots are being created by a cron job or some trigger.
        // If no snapshots, return current balance as a single point?

        // Let's format for the chart
        const history = snapshots.map(s => ({
            date: s.timestamp.toISOString(),
            value: s.totalValue,
            profit: s.totalPnl, // Ensure this matches what chart expects
        }));

        // If history is empty, add current state
        if (history.length === 0) {
            history.push({
                date: new Date().toISOString(),
                value: portfolio.currentBalance || 0,
                profit: portfolio.totalPnl || 0,
            });
            // And maybe a start point if possible, using initial balance?
            if (portfolio.createdAt >= fromDate) {
                history.unshift({
                    date: portfolio.createdAt.toISOString(),
                    value: portfolio.initialBalance || 0,
                    profit: 0,
                });
            }
        }

        return NextResponse.json({
            success: true,
            history,
        });

    } catch (error) {
        console.error("Error fetching portfolio history:", error);
        return NextResponse.json(
            { error: "Failed to fetch portfolio history" },
            { status: 500 }
        );
    }
}
