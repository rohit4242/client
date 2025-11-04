import { NextRequest, NextResponse } from "next/server";
import { getPortfolioStats } from "@/db/actions/customer/get-portfolio-stats";
import { getPortfolioChartData } from "@/db/actions/customer/get-portfolio-chart-data";
import db from "@/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const [stats, chartData] = await Promise.all([
      getPortfolioStats(),
      getPortfolioChartData("ALL"),
    ]);

    if (!stats) {
      return NextResponse.json(
        { error: "Performance data not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ stats, chartData });
  } catch (error) {
    console.error("Error fetching performance data:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
