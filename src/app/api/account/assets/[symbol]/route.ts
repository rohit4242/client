import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getBalanceBySymbol } from "@/lib/trading-utils";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
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

  const asset = await getBalanceBySymbol(configurationRestAPI, symbol);
  console.log("asset from the route: ", asset);

  return NextResponse.json({ asset }, { status: 200 });
}
