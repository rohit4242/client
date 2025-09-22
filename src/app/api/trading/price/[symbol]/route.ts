import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getPriceBySymbol } from "@/lib/trading-utils";
import db from "@/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol } = await params;
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { apiKey, apiSecret } = body;

    const configurationRestAPI = {
      apiKey: apiKey,
      apiSecret: apiSecret,
    };
   
    const price = await getPriceBySymbol(configurationRestAPI, symbol);
    return NextResponse.json({ price }, { status: 200 });
  } catch (error) {
    console.error("Error fetching price:", error);
    return NextResponse.json(
      { error: "Failed to fetch price" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol } = await params;
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's active exchange
    const userAccount = await db.userAccount.findFirst({
      where: { userId: session.user.id },
      include: {
        exchanges: {
          where: { isActive: true },
        },
      },
    });

    if (!userAccount || userAccount.exchanges.length === 0) {
      return NextResponse.json(
        { error: "No active exchange found" },
        { status: 400 }
      );
    }

    const activeExchange = userAccount.exchanges[0];
    const configurationRestAPI = {
      apiKey: activeExchange.apiKey,
      apiSecret: activeExchange.apiSecret,
    };

    const price = await getPriceBySymbol(configurationRestAPI, symbol);
    return NextResponse.json({ price }, { status: 200 });
  } catch (error) {
    console.error("Error fetching price:", error);
    return NextResponse.json(
      { error: "Failed to fetch price" },
      { status: 500 }
    );
  }
}
