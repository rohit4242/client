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

    const user = await db.user.findFirst({
      where: { email },
      select: { id: true, email: true },
    });

    if (!user) {
      return NextResponse.json({ success: true, signals: [] }, { headers: CORS_HEADERS });
    }

    const portfolio = await db.portfolio.findFirst({
      where: { userId: user.id },
      select: { id: true },
    });

    if (!portfolio) {
      return NextResponse.json({ success: true, signals: [] }, { headers: CORS_HEADERS });
    }

    const bots = await db.bot.findMany({
      where: { portfolioId: portfolio.id },
      select: { id: true },
    });

    if (bots.length === 0) {
      return NextResponse.json({ success: true, signals: [] }, { headers: CORS_HEADERS });
    }

    const botIds = bots.map(b => b.id);

    const signals = await db.signal.findMany({
      where: { botId: { in: botIds }, visibleToCustomer: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, signals }, { headers: CORS_HEADERS });
  } catch (error) {
    console.error("Error fetching signals:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}


