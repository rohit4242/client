import { NextRequest, NextResponse } from "next/server";
import { isAdmin, isAgent } from "@/lib/auth-utils";
import db from "@/db";

interface RouteParams {
    params: Promise<{
        userId: string;
    }>;
}

/**
 * GET /api/admin/users/[userId]/orders
 * Get recent orders for a specific user
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

        const searchParams = request.nextUrl.searchParams;
        const limit = parseInt(searchParams.get("limit") || "10");

        // Get user's orders
        // First find the portfolio(s) for the user
        const portfolio = await db.portfolio.findFirst({
            where: {
                userId,
            },
        });

        if (!portfolio) {
            return NextResponse.json({ orders: [] }); // No portfolio, no orders
        }

        const orders = await db.order.findMany({
            where: {
                portfolioId: portfolio.id,
            },
            orderBy: {
                createdAt: "desc",
            },
            take: limit,
            select: {
                id: true,
                symbol: true,
                type: true,
                side: true,
                orderType: true,
                price: true,
                quantity: true,
                value: true,
                status: true,
                createdAt: true,
            }
        });

        return NextResponse.json({
            success: true,
            orders,
        });

    } catch (error) {
        console.error("Error fetching user orders:", error);
        return NextResponse.json(
            { error: "Failed to fetch user orders" },
            { status: 500 }
        );
    }
}
