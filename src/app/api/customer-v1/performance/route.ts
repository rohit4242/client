import { NextRequest, NextResponse } from "next/server";
import db from "@/db";
import { getPortfolioStatsCustomerV1 } from "@/db/actions/customer-v1/get-portfolio-stats";
import { getPortfolioChartDataCustomerV1 } from "@/db/actions/customer-v1/get-portfolio-chart-data";

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
    const period = (searchParams.get("period") as
      | "1M"
      | "3M"
      | "6M"
      | "1Y"
      | "ALL"
      | null) ?? "ALL";

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

    const [stats, chartData] = await Promise.all([
      getPortfolioStatsCustomerV1(user.id),
      getPortfolioChartDataCustomerV1(user.id, period ?? "ALL"),
    ]);

    if (!stats) {
      return NextResponse.json(
        { error: "Performance data not found" },
        { status: 404, headers: CORS_HEADERS }
      );
    }

    return NextResponse.json({ stats, chartData }, { headers: CORS_HEADERS });
  } catch (error) {
    console.error("Error fetching performance data:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
