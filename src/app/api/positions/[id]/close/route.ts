import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import db from "@/db";
import { executeSignalTrade } from "@/lib/signal-bot/trade-executor";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const positionId = params.id;

    // Get the position with bot and exchange info
    const position = await db.botTrade.findFirst({
      where: {
        id: positionId,
        bot: {
          userAccount: {
            userId: session.user.id,
          },
        },
        status: "Open",
      },
      include: {
        bot: {
          include: {
            exchange: true,
          },
        },
        signal: true,
      },
    });

    if (!position) {
      return NextResponse.json(
        { error: "Position not found or already closed" },
        { status: 404 }
      );
    }

    // Get current price for the symbol
    const currentPrice = 50000; // You should fetch this from your price service

    // Execute close trade
    const action = position.side === "Long" ? "EXIT_LONG" : "EXIT_SHORT";
    
    await executeSignalTrade({
      bot: {
        id: position.bot.id,
        name: position.bot.name,
        userAccountId: position.bot.userAccountId,
        exchangeId: position.bot.exchangeId,
        symbol: position.bot.symbol,
        timeframe: position.bot.timeframe,
        isActive: position.bot.isActive,
        portfolioPercent: position.bot.portfolioPercent,
        stopLoss: position.bot.stopLoss ? Number(position.bot.stopLoss) : null,
        takeProfit: position.bot.takeProfit ? Number(position.bot.takeProfit) : null,
        trailingStop: position.bot.trailingStop,
        dcaEnabled: position.bot.dcaEnabled,
        dcaSteps: position.bot.dcaSteps,
        dcaStepPercent: position.bot.dcaStepPercent,
        webhookUrl: position.bot.webhookUrl,
        webhookSecret: position.bot.webhookSecret,
        enterLongMsg: position.bot.enterLongMsg,
        exitLongMsg: position.bot.exitLongMsg,
        enterShortMsg: position.bot.enterShortMsg,
        exitShortMsg: position.bot.exitShortMsg,
        exitAllMsg: position.bot.exitAllMsg,
        totalTrades: position.bot.totalTrades,
        winningTrades: position.bot.winningTrades,
        totalPnl: Number(position.bot.totalPnl),
        exchange: {
          id: position.bot.exchange.id,
          name: position.bot.exchange.name,
          apiKey: position.bot.exchange.apiKey,
          apiSecret: position.bot.exchange.apiSecret,
          isActive: position.bot.exchange.isActive,
        },
        createdAt: position.bot.createdAt,
        updatedAt: position.bot.updatedAt,
      },
      signal: {
        id: position.signal.id,
        botId: position.signal.botId,
        action: position.signal.action,
        symbol: position.signal.symbol,
        price: position.signal.price ? Number(position.signal.price) : null,
        message: position.signal.message,
        strategy: position.signal.strategy,
        timeframe: position.signal.timeframe,
        processed: position.signal.processed,
        processedAt: position.signal.processedAt,
        error: position.signal.error,
        createdAt: position.signal.createdAt,
      },
      action,
      currentPrice,
      existingTrade: {
        id: position.id,
        botId: position.botId,
        signalId: position.signalId,
        symbol: position.symbol,
        side: position.side,
        entryPrice: Number(position.entryPrice),
        quantity: Number(position.quantity),
        entryValue: Number(position.entryValue),
        entryTime: position.entryTime,
        status: position.status,
        exitPrice: position.exitPrice ? Number(position.exitPrice) : null,
        exitTime: position.exitTime,
        exitValue: position.exitValue ? Number(position.exitValue) : null,
        profit: position.profit ? Number(position.profit) : null,
        profitPercentage: position.profitPercentage ? Number(position.profitPercentage) : null,
        tradeType: position.tradeType,
        parentTradeId: position.parentTradeId,
        createdAt: position.createdAt,
        updatedAt: position.updatedAt,
      },
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Error closing position:", error);
    return NextResponse.json(
      { error: "Failed to close position" },
      { status: 500 }
    );
  }
}
