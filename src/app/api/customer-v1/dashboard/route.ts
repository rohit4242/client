import { NextRequest, NextResponse } from "next/server";
import db from "@/db";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400, headers: CORS_HEADERS });
    }

    const user = await db.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404, headers: CORS_HEADERS }
      );
    }

    const portfolio = await db.portfolio.findFirst({
      where: { userId: user.id },
      select: {
        currentBalance: true,
        totalPnl: true,
        totalPnlPercent: true,
        winRate: true,
        totalTrades: true,
        activeTrades: true,
        profitFactor: true,
        lastCalculatedAt: true,
      },
    });

    if (!portfolio) {
      return NextResponse.json(
        { success: true, stats: null },
        { headers: CORS_HEADERS }
      );
    }

    const stats = {
      totalBalance: portfolio.currentBalance,
      totalPnl: portfolio.totalPnl,
      roiPercent: portfolio.totalPnlPercent,
      winRate: portfolio.winRate,
      totalTrades: portfolio.totalTrades,
      activeTrades: portfolio.activeTrades,
      profitFactor: portfolio.profitFactor,
      lastCalculatedAt: portfolio.lastCalculatedAt.toISOString(),
    };

    return NextResponse.json({ success: true, stats }, { headers: CORS_HEADERS });
  } catch (error) {
    console.error("Error fetching dashboard:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
