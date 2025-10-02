import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getPriceBySymbol } from "@/lib/trading-utils";

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
    // Use public Binance price for minimal coupling and caching benefits
    const url = `https://api.binance.com/api/v3/ticker/price?symbol=${encodeURIComponent(
      symbol.toUpperCase()
    )}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok)
      return NextResponse.json({ error: "Upstream error" }, { status: 502 });
    const data = await res.json();
    const price = parseFloat(data?.price);
    if (!price || isNaN(price)) throw new Error("Invalid upstream price");
    return NextResponse.json(
      { price, symbol: symbol.toUpperCase(), timestamp: Date.now() },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching price:", error);
    return NextResponse.json(
      { error: "Failed to fetch price" },
      { status: 500 }
    );
  }
}
