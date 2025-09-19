import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import db from "@/db";
import { executeSignalTrade } from "@/lib/signal-bot/trade-executor";
import { SignalAction } from "@/types/signal-bot";

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
        ...position.bot,
        // Provide defaults for missing required fields
        multipleEntries: position.bot.multipleEntries || false,
        swingTrade: position.bot.swingTrade || false,
        botStartSource: position.bot.botStartSource || "TRADINGVIEW",
        botSettingsFormat: position.bot.botSettingsFormat || "FORM",
        orderType: position.bot.orderType || "Market",
        limitOrderDeviation: position.bot.limitOrderDeviation,
        limitOrderDeviationType: position.bot.limitOrderDeviationType || "PERCENTAGE",
        timeInForce: position.bot.timeInForce || 60,
        amountType: position.bot.amountType || "PORTFOLIO_PERCENT",
        quoteAmount: position.bot.quoteAmount,
        contractAmount: position.bot.contractAmount,
        leverage: position.bot.leverage || 1,
        customQuantity: position.bot.customQuantity || false,
        moveStopToBreakeven: position.bot.moveStopToBreakeven || false,
        breakEvenTrigger: position.bot.breakEvenTrigger,
        trailingStopActivation: position.bot.trailingStopActivation,
        trailingStopDistance: position.bot.trailingStopDistance,
        reduceOnlyOrders: position.bot.reduceOnlyOrders || false,
        conditionalOrders: position.bot.conditionalOrders || false,
        dcaTakeProfitType: position.bot.dcaTakeProfitType || "AVERAGE_PRICE",
        dcaStopLossType: position.bot.dcaStopLossType || "AVERAGE_PRICE",
        dcaOrderSizeMultiplier: position.bot.dcaOrderSizeMultiplier || 1,
        dcaPriceDeviationMultiplier: position.bot.dcaPriceDeviationMultiplier || 1,
        customQuantityMsg: position.bot.customQuantityMsg,
        stopLoss: position.bot.stopLoss ? Number(position.bot.stopLoss) : null,
        totalPnl: Number(position.bot.totalPnl),
      },
      signal: position.signal ? {
        id: position.signal.id,
        botId: position.signal.botId,
        action: position.signal.action,
        symbol: position.signal.symbol,
        price: position.signal.price ? Number(position.signal.price) : null,
        quantity: position.signal.quantity ? Number(position.signal.quantity) : null,
        message: position.signal.message,
        strategy: position.signal.strategy,
        timeframe: position.signal.timeframe,
        processed: position.signal.processed,
        processedAt: position.signal.processedAt,
        error: position.signal.error,
        createdAt: position.signal.createdAt,
      } : {
        id: "manual-close",
        botId: position.botId,
        action: action as SignalAction,
        symbol: position.symbol,
        price: currentPrice,
        quantity: null,
        message: "Manual position close",
        strategy: null,
        timeframe: null,
        processed: false,
        processedAt: null,
        error: null,
        createdAt: new Date(),
      },
      action,
      currentPrice,
      existingTrade: {
        ...position,
        entryPrice: Number(position.entryPrice),
        quantity: Number(position.quantity),
        entryValue: Number(position.entryValue),
        exitPrice: position.exitPrice ? Number(position.exitPrice) : null,
        exitValue: position.exitValue ? Number(position.exitValue) : null,
        profit: position.profit ? Number(position.profit) : null,
        profitPercentage: position.profitPercentage ? Number(position.profitPercentage) : null,
        stopLoss: position.stopLoss ? Number(position.stopLoss) : null,
        originalStopLoss: position.originalStopLoss ? Number(position.originalStopLoss) : null,
        trailingStopPrice: position.trailingStopPrice ? Number(position.trailingStopPrice) : null,
        leverage: position.leverage ? Number(position.leverage) : null,
        // Provide defaults for missing required fields
        stopLossMovedToBreakeven: position.stopLossMovedToBreakeven || false,
        trailingStopActivated: position.trailingStopActivated || false,
        orderType: position.orderType || "Market",
        reduceOnly: position.reduceOnly || false,
        takeProfitLevels: [],
        dcaLevel: position.dcaLevel,
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
