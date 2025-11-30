import { NextRequest, NextResponse } from "next/server";
import db from "@/db";
import { createSignalBotSchema } from "@/db/schema/signal-bot";
import { nanoid } from "nanoid";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getSelectedUser } from "@/lib/selected-user-server";

// GET /api/signal-bots - Get all signal bots for current user or selected user (admin)
export async function GET() {
  try {
    const session = await auth.api.getSession({
        headers: await headers(),
      });
  
      if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

    // Check if admin is using selected user
    const selectedUser = await getSelectedUser();
    const targetUserId = selectedUser?.id || session.user.id;

    const portfolio = await db.portfolio.findFirst({
      where: { userId: targetUserId },
    });

    if (!portfolio) {
      return NextResponse.json({ error: "User account not found" }, { status: 404 });
    }

    const signalBots = await db.bot.findMany({
      where: { portfolioId: portfolio.id },
      include: {
        exchange: {
          select: {
            id: true,
            name: true,
            isActive: true,
            spotValue: true,
            marginValue: true,
            totalValue: true,
          },
        },
        _count: {
          select: {
            signals: true,
            positions: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Transform to match SignalBot interface
    const transformedBots = signalBots.map((bot) => ({
      id: bot.id,
      name: bot.name,
      description: bot.description,
      portfolioId: bot.portfolioId,
      exchangeId: bot.exchangeId,
      symbols: bot.symbols,
      isActive: bot.isActive,
      orderType: bot.orderType as "Market" | "Limit" | "Stop",
      tradeAmount: bot.tradeAmount,
      tradeAmountType: bot.tradeAmountType,
      leverage: bot.leverage,
      accountType: bot.accountType,
      marginType: bot.marginType,
      sideEffectType: bot.sideEffectType,
      autoRepay: bot.autoRepay,
      maxBorrowPercent: bot.maxBorrowPercent,
      stopLoss: bot.stopLoss,
      takeProfit: bot.takeProfit,
      webhookUrl: `${process.env.NEXTAUTH_URL}/api/webhook/signal-bot`,
      webhookSecret: bot.webhookSecret,
      totalTrades: bot.totalTrades,
      winTrades: bot.winTrades,
      lossTrades: bot.lossTrades,
      totalPnl: bot.totalPnl,
      totalVolume: bot.totalVolume,
      totalBorrowed: bot.totalBorrowed,
      totalInterest: bot.totalInterest,
      exchange: bot.exchange,
      createdAt: bot.createdAt,
      updatedAt: bot.updatedAt,
    }));

    return NextResponse.json(transformedBots);
  } catch (error) {
    console.error("Error fetching signal bots:", error);
    return NextResponse.json(
      { error: "Failed to fetch signal bots" },
      { status: 500 }
    );
  }
}

// POST /api/signal-bots - Create new signal bot
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
        headers: await headers(),
      });
  
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if admin is using selected user
    const selectedUser = await getSelectedUser();
    const targetUserId = selectedUser?.id || session.user.id;

    const portfolio = await db.portfolio.findFirst({
      where: { userId: targetUserId },
    });

    if (!portfolio) {
      return NextResponse.json({ error: "User account not found" }, { status: 404 });
    }

    const body = await request.json();
    
    // Validate request body
    const validatedData = createSignalBotSchema.safeParse(body);
    if (!validatedData.success) {
      return NextResponse.json(
        { 
          error: "Invalid request data", 
          details: validatedData.error.issues 
        },
        { status: 400 }
      );
    }

    const data = validatedData.data;

    // Verify exchange exists and belongs to user
    const exchange = await db.exchange.findFirst({
      where: {
        id: data.exchangeId,
        portfolioId: portfolio.id,
        isActive: true,
      },
    });

    if (!exchange) {
      return NextResponse.json(
        { error: "Exchange not found or not active" },
        { status: 404 }
      );
    }

    // Create signal bot
    const signalBot = await db.bot.create({
      data: {
        portfolioId: portfolio.id,
        exchangeId: data.exchangeId,
        name: data.name,
        description: data.description,
        isActive: true,
        symbols: data.symbols,
        tradeAmount: data.tradeAmount,
        tradeAmountType: data.tradeAmountType || 'QUOTE',
        orderType: data.orderType,
        leverage: data.leverage,
        accountType: data.accountType || 'SPOT',
        marginType: data.marginType,
        sideEffectType: data.sideEffectType || 'NO_SIDE_EFFECT',
        autoRepay: data.autoRepay || false,
        maxBorrowPercent: data.maxBorrowPercent || 50,
        stopLoss: data.stopLoss,
        takeProfit: data.takeProfit,
        webhookSecret: nanoid(32), // Generate secure webhook secret
      },
      include: {
        exchange: {
          select: {
            id: true,
            name: true,
            isActive: true,
            totalValue: true,
          },
        },
      },
    });

    // Generate webhook URL
    const webhookUrl = `${process.env.NEXTAUTH_URL}/api/webhook/signal-bot`;

    // Transform response to match SignalBot interface
    const response = {
      id: signalBot.id,
      name: signalBot.name,
      description: signalBot.description,
      portfolioId: signalBot.portfolioId,
      exchangeId: signalBot.exchangeId,
      symbols: signalBot.symbols,
      isActive: signalBot.isActive,
      orderType: signalBot.orderType as "Market" | "Limit" | "Stop",
      tradeAmount: signalBot.tradeAmount,
      tradeAmountType: signalBot.tradeAmountType,
      leverage: signalBot.leverage,
      accountType: signalBot.accountType,
      marginType: signalBot.marginType,
      sideEffectType: signalBot.sideEffectType,
      autoRepay: signalBot.autoRepay,
      maxBorrowPercent: signalBot.maxBorrowPercent,
      stopLoss: signalBot.stopLoss,
      takeProfit: signalBot.takeProfit,
      webhookUrl,
      webhookSecret: signalBot.webhookSecret,
      totalTrades: signalBot.totalTrades,
      winTrades: signalBot.winTrades,
      lossTrades: signalBot.lossTrades,
      totalPnl: signalBot.totalPnl,
      totalVolume: signalBot.totalVolume,
      totalBorrowed: signalBot.totalBorrowed,
      totalInterest: signalBot.totalInterest,
      exchange: signalBot.exchange,
      createdAt: signalBot.createdAt,
      updatedAt: signalBot.updatedAt,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Error creating signal bot:", error);
    return NextResponse.json(
      { error: "Failed to create signal bot" },
      { status: 500 }
    );
  }
}
