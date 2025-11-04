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

    console.log("email: ", email)

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400, headers: CORS_HEADERS });
    }

    // Select only columns that are guaranteed to exist to avoid touching non-existent DB columns
    const user = await db.user.findFirst({
      where: {
        email: email,
      },
      select: { id: true, email: true },
    });

    if (!user) {
      // Return empty orders to simplify client handling
      return NextResponse.json({ success: true, orders: [] }, { headers: CORS_HEADERS });
    }
    console.log("user: ", user)

    // Find user's portfolio
    const portfolio = await db.portfolio.findFirst({
      where: {
        userId: user.id,
      },
      select: { id: true },
    });

    console.log("portfolio: ", portfolio)

    if (!portfolio) {
      return NextResponse.json({ success: true, orders: [] }, { headers: CORS_HEADERS });
    }

    // Fetch orders for the portfolio
    const orders = await db.order.findMany({
      where: { portfolioId: portfolio.id },
      orderBy: { createdAt: "desc" },
    });

    console.log("orders: ", orders)

    return NextResponse.json({ success: true, orders }, { headers: CORS_HEADERS });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
