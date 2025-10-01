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
    const portfolio = await db.portfolio.findFirst({
      where: { userId: session.user.id },
      include: {
        exchanges: {
          where: { isActive: true },
        },
      },
    });

    if (!portfolio || portfolio.exchanges.length === 0) {
      return NextResponse.json(
        { error: "No active exchange found" },
        { status: 400 }
      );
    }

    const activeExchange = portfolio.exchanges[0];
    const configurationRestAPI = {
      apiKey: activeExchange.apiKey,
      apiSecret: activeExchange.apiSecret,
    };

    const priceData = await getPriceBySymbol(configurationRestAPI, symbol);
    
    // Normalize the response format
    let price: number;
    if (typeof priceData === 'object' && priceData?.price) {
      price = parseFloat(priceData.price);
    } else if (typeof priceData === 'string') {
      price = parseFloat(priceData);
    } else if (typeof priceData === 'number') {
      price = priceData;
    } else {
      throw new Error('Invalid price data format');
    }

    // Ensure price is valid
    if (isNaN(price) || price <= 0) {
      throw new Error('Invalid price value');
    }

    return NextResponse.json({ 
      price: price,
      symbol: symbol,
      timestamp: Date.now()
    }, { status: 200 });
  } catch (error) {
    console.error("Error fetching price:", error);
    return NextResponse.json(
      { error: "Failed to fetch price" },
      { status: 500 }
    );
  }
}
