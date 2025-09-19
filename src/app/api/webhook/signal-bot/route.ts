import { NextRequest, NextResponse } from "next/server";
import db from "@/db";
import { tradingViewAlertSchema } from "@/db/schema/signal-bot";
import { SignalAction } from "@prisma/client";
import { processSignal } from "@/lib/signal-bot/signal-processor";
import { SignalBot } from "@/types/signal-bot";

export async function POST(request: NextRequest) {
  try {
    console.log("=== Signal Bot Webhook Received ===");
    
    // Parse the request body
    const body = await request.json();
    console.log("Webhook payload:", body);

    // Validate the payload structure
    const validatedAlert = tradingViewAlertSchema.safeParse(body);
    if (!validatedAlert.success) {
      console.error("Invalid webhook payload:", validatedAlert.error);
      return NextResponse.json(
        { 
          error: "Invalid webhook payload", 
          details: validatedAlert.error 
        },
        { status: 400 }
      );
    }

    const alert = validatedAlert.data;

    // Find the target bot with all necessary relations
    let bot;
    if (alert.botId) {
      bot = await db.signalBot.findUnique({
        where: { id: alert.botId },
        include: {
          exchange: true,
          userAccount: true,
        },
      });
    } else if (alert.botName) {
      bot = await db.signalBot.findFirst({
        where: { name: alert.botName },
        include: {
          exchange: true,
          userAccount: true,
        },
      });
    } else {
      return NextResponse.json(
        { error: "Bot identifier (botId or botName) is required" },
        { status: 400 }
      );
    }

    if (!bot) {
      return NextResponse.json(
        { error: "Signal bot not found" },
        { status: 404 }
      );
    }

    if (!bot.isActive) {
      return NextResponse.json(
        { error: "Signal bot is not active" },
        { status: 400 }
      );
    }

    // Validate webhook secret if configured
    if (bot.webhookSecret && alert.secret !== bot.webhookSecret) {
      console.error("Invalid webhook secret");
      return NextResponse.json(
        { error: "Invalid webhook secret" },
        { status: 401 }
      );
    }

    // Parse the signal action
    const signalAction = parseSignalAction(alert.action, bot as unknown as SignalBot);
    if (!signalAction) {
      return NextResponse.json(
        { error: `Unknown signal action: ${alert.action}` },
        { status: 400 }
      );
    }

    // Validate symbol matches bot configuration
    if (!bot.symbols.includes(alert.symbol)) {
      console.warn(`Symbol not configured: webhook=${alert.symbol}, bot symbols=${bot.symbols.join(', ')}`);
      return NextResponse.json(
        { error: `Symbol ${alert.symbol} is not configured for this bot. Configured symbols: ${bot.symbols.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate custom quantity if provided
    if (alert.quantity && alert.quantity <= 0) {
      return NextResponse.json(
        { error: "Invalid custom quantity: must be greater than 0" },
        { status: 400 }
      );
    }

    // Create the signal record
    const signal = await db.signal.create({
      data: {
        botId: bot.id,
        action: signalAction,
        symbol: alert.symbol,
        price: alert.price || null,
        quantity: alert.quantity || null,
        message: alert.message || null,
        strategy: alert.strategy || null,
        timeframe: alert.timeframe || null,
      },
    });

    console.log(`Signal created: ${signal.id}`);

    // Process the signal asynchronously
    try {
      const processingResult = await processSignal(signal.id);
      console.log("Signal processing result:", processingResult);

      if (processingResult.success) {
        return NextResponse.json({
          success: true,
          signalId: signal.id,
          tradeId: processingResult.tradeId,
          message: "Signal processed successfully",
        });
      } else {
        return NextResponse.json({
          success: false,
          signalId: signal.id,
          error: processingResult.error,
          skipped: processingResult.skipped,
          skipReason: processingResult.skipReason,
        });
      }
    } catch (processingError) {
      console.error("Signal processing failed:", processingError);
      return NextResponse.json({
        success: false,
        signalId: signal.id,
        error: processingError instanceof Error ? processingError.message : "Processing failed",
      });
    }

  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function parseSignalAction(action: string, bot: SignalBot): SignalAction | null {
  const actionUpper = action.toUpperCase();

  // Direct action mapping
  switch (actionUpper) {
    case "ENTER_LONG":
    case "BUY":
    case "LONG":
      return SignalAction.ENTER_LONG;
    
    case "EXIT_LONG":
    case "SELL_LONG":
    case "CLOSE_LONG":
      return SignalAction.EXIT_LONG;
    
    case "ENTER_SHORT":
    case "SELL":
    case "SHORT":
      return SignalAction.ENTER_SHORT;
    
    case "EXIT_SHORT":
    case "BUY_SHORT":
    case "CLOSE_SHORT":
      return SignalAction.EXIT_SHORT;
  }

  // Check custom message mapping
  if (bot.enterLongMsg && action === bot.enterLongMsg) {
    return SignalAction.ENTER_LONG;
  }
  
  if (bot.exitLongMsg && action === bot.exitLongMsg) {
    return SignalAction.EXIT_LONG;
  }
  
  if (bot.enterShortMsg && action === bot.enterShortMsg) {
    return SignalAction.ENTER_SHORT;
  }
  
  if (bot.exitShortMsg && action === bot.exitShortMsg) {
    return SignalAction.EXIT_SHORT;
  }

  return null;
}

// GET endpoint to check webhook status and provide setup information
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const botId = url.searchParams.get("botId");

  if (!botId) {
    return NextResponse.json(
      { error: "Bot ID is required" },
      { status: 400 }
    );
  }

  try {
    const bot = await db.signalBot.findUnique({
      where: { id: botId },
      include: {
        _count: {
          select: {
            signals: true,
            botTrades: true,
          },
        },
      },
    });

    if (!bot) {
      return NextResponse.json(
        { error: "Bot not found" },
        { status: 404 }
      );
    }

    // Generate webhook information
    const webhookEndpoint = `${process.env.NEXTAUTH_URL}/api/webhook/signal-bot`;
    
    // Get recent signals for status
    const recentSignals = await db.signal.findMany({
      where: { botId: bot.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        action: true,
        symbol: true,
        processed: true,
        error: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      // Basic bot info
      botId: bot.id,
      botName: bot.name,
      isActive: bot.isActive,
      
      // Webhook configuration
      webhookEndpoint,
      webhookUrl: bot.webhookUrl,
      webhookSecret: bot.webhookSecret ? "***configured***" : null,
      
      // Bot configuration summary
      configuration: {
        symbols: bot.symbols,
        orderType: bot.orderType,
        portfolioPercent: bot.portfolioPercent,
        leverage: bot.leverage,
        stopLoss: bot.stopLoss,
        takeProfit: bot.takeProfit,
      },
      
      // Statistics
      statistics: {
        totalSignals: bot._count.signals,
        totalTrades: bot._count.botTrades,
        totalPnl: bot.totalPnl,
        winRate: bot.totalTrades > 0 ? (bot.winningTrades / bot.totalTrades) * 100 : 0,
      },
      
      // Recent activity
      recentSignals: recentSignals.map(signal => ({
        id: signal.id,
        action: signal.action,
        symbol: signal.symbol,
        processed: signal.processed,
        hasError: !!signal.error,
        timestamp: signal.createdAt,
      })),
      
      // Webhook testing info
      testingInfo: {
        endpoint: webhookEndpoint,
        method: "POST",
        contentType: "application/json",
        requiredFields: ["action", "symbol"],
        optionalFields: ["price", "quantity"],
        examplePayload: {
          botId: bot.id,
          ...(bot.webhookSecret && { secret: "your-webhook-secret" }),
          action: "ENTER_LONG",
          symbol: bot.symbols[0] || "BTCUSDT",
          price: 50000,
        },
      },
    });

  } catch (error) {
    console.error("GET webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}