import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import db from "@/db";
import { auth } from "@/lib/auth";
import { createExchangeSchema } from "@/db/schema/exchange";
import { Spot } from "@binance/spot";
import { calculateTotalUSDValue } from "@/lib/trading-utils";
import { getSelectedUser } from "@/lib/selected-user-server";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if admin is using selected user
    const selectedUser = await getSelectedUser();
    const targetUserId = selectedUser?.id || session.user.id;
    
    const portfolio = await db.portfolio.findFirst({
      where: {
        userId: targetUserId,
      },
    });

    if (!portfolio) {
      return NextResponse.json({ error: "User account not found" }, { status: 404 });
    }

    const exchanges = await db.exchange.findMany({
      where: {
        portfolioId: portfolio?.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    for (const exchange of exchanges) {
      if (exchange.isActive) {
        const configurationRestAPI = {
          apiKey: exchange.apiKey,
          apiSecret: exchange.apiSecret,
        };

        const totalPortfolioValue = await calculateTotalUSDValue(
          configurationRestAPI
        );

        await db.exchange.update({
          where: { id: exchange.id },
          data: {
            totalValue: totalPortfolioValue.toString(),
            lastSyncedAt: new Date(),
          },
        });
      }
    }

    return NextResponse.json(exchanges);
  } catch (error) {
    console.error("Error fetching exchanges:", error);
    return NextResponse.json(
      { error: "Failed to fetch exchanges" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { userId, ...exchangeData } = body;
    const validatedExchange = createExchangeSchema.safeParse(exchangeData);
    if (!validatedExchange.success) {
      return NextResponse.json(
        { error: validatedExchange.error.message },
        { status: 400 }
      );
    }
    const { name, apiKey, apiSecret, positionMode } = validatedExchange.data;

    console.log(name, apiKey, apiSecret, positionMode);

    // Use userId from body if provided (admin creating for customer), otherwise use session user
    const targetUserId = userId || session.user.id;

    let portfolio = await db.portfolio.findFirst({
      where: {
        userId: targetUserId,
      },
    });

    // create user account if not exists
    if (!portfolio) {
      portfolio = await db.portfolio.create({
        data: {
          userId: targetUserId,
          name: name.toUpperCase(),
        },
      });
    }

    console.log(portfolio);

    // check if the exchange already exists
    const existingExchange = await db.exchange.findFirst({
      where: {
        apiKey: apiKey,
      },
    });

    if (existingExchange) {
      return NextResponse.json(
        { error: "Exchange already exists" },
        { status: 400 }
      );
    }

    // Validate Binance API credentials before saving to database
    const configurationRestAPI = {
      apiKey: apiKey,
      apiSecret: apiSecret,
    };

    const client = new Spot({ configurationRestAPI });

    // Test the API credentials by fetching account information
    const accountResponse = await client.restAPI.getAccount();
    console.log(accountResponse);

    // Check if the response is valid (successful authentication)
    if (!accountResponse || typeof accountResponse !== "object") {
      return NextResponse.json(
        { error: "Invalid API key or secret - Authentication failed" },
        { status: 400 }
      );
    }

    const totalPortfolioValue = await calculateTotalUSDValue(
      configurationRestAPI
    );
    console.log(
      "totalPortfolioValue from the calculateTotalUSDValue function: ",
      totalPortfolioValue
    );

    const exchange = await db.exchange.create({
      data: {
        portfolioId: portfolio.id,
        name: name.toUpperCase(),
        apiKey,
        apiSecret,
        positionMode: positionMode,
        isActive: true,
        totalValue: totalPortfolioValue.toString(),
      },
    });

    console.log("Exchange created successfully");

    // Sync portfolio balance from the exchange (sets initial balance if not set)
    try {
      const { syncPortfolioBalance } = await import("@/db/actions/admin/sync-portfolio-balance");
      await syncPortfolioBalance(targetUserId);
      console.log(`Portfolio balance synced for user ${targetUserId}`);
    } catch (syncError) {
      console.error("Error syncing portfolio balance:", syncError);
      // Don't fail the exchange creation if sync fails
    }

    return NextResponse.json(exchange, { status: 201 });
  } catch (error) {
    console.error("Error creating exchange:", error);
    return NextResponse.json(
      { error: "Failed to create exchange" },
      { status: 500 }
    );
  }
}
