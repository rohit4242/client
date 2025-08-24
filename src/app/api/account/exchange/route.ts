import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { tradingPairInfo } from "@/lib/trading-utils";

export async function POST(request: NextRequest) {
  console.log("request from the exchange route: ", request);
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { apiKey, apiSecret, symbol } = body;

  const configurationRestAPI = {
    apiKey: apiKey,
    apiSecret: apiSecret,
  };

  try {
    const exchangeInfo = await tradingPairInfo(configurationRestAPI, symbol);
    return NextResponse.json({ exchangeInfo }, { status: 200 });
  } catch (error) {
    console.error("Error fetching exchange info:", error);
    return NextResponse.json(
      { error: "Failed to fetch exchange info" },
      { status: 500 }
    );
  }
}
