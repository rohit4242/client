import { NextRequest, NextResponse } from "next/server";
import db from "@/db";
import { tradingViewAlertSchema, signalActionSchema } from "@/db/schema/signal-bot";
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

    // Find the target bot
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
    if (alert.symbol !== bot.symbol) {
      console.warn(`Symbol mismatch: webhook=${alert.symbol}, bot=${bot.symbol}`);
      // Could be flexible here - either reject or allow
    }

    // Create signal record
    const signal = await db.signal.create({
      data: {
        botId: bot.id,
        action: signalAction,
        symbol: alert.symbol,
        price: alert.price ? Number(alert.price) : null,
        message: alert.message || null,
        strategy: alert.strategy || null,
        timeframe: alert.timeframe || bot.timeframe,
      },
    });

    console.log("Signal created:", signal);

    // Process the signal asynchronously
    try {
      const result = await processSignal(signal.id);
      console.log("Signal processing result:", result);
      
      return NextResponse.json({
        success: true,
        message: "Signal received and processed",
        signalId: signal.id,
        result,
      });
    } catch (processingError) {
      console.error("Signal processing error:", processingError);
      
      // Update signal with error
      await db.signal.update({
        where: { id: signal.id },
        data: {
          processed: true,
          processedAt: new Date(),
          error: processingError instanceof Error ? processingError.message : "Processing failed",
        },
      });

      return NextResponse.json({
        success: false,
        message: "Signal received but processing failed",
        signalId: signal.id,
        error: processingError instanceof Error ? processingError.message : "Processing failed",
      });
    }

  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

// Helper function to parse signal action from TradingView alert
function parseSignalAction(action: string, bot: SignalBot): SignalAction | null {
  const normalizedAction = action.toUpperCase().trim();
  
  // Direct mapping
  const directMappings: Record<string, SignalAction> = {
    "ENTER_LONG": SignalAction.ENTER_LONG,
    "EXIT_LONG": SignalAction.EXIT_LONG,
    "ENTER_SHORT": SignalAction.ENTER_SHORT,
    "EXIT_SHORT": SignalAction.EXIT_SHORT,
    "EXIT_ALL": SignalAction.EXIT_ALL,
    "BUY": SignalAction.ENTER_LONG,
    "SELL": SignalAction.EXIT_LONG,
    "LONG": SignalAction.ENTER_LONG,
    "SHORT": SignalAction.ENTER_SHORT,
    "CLOSE": SignalAction.EXIT_ALL,
    "CLOSE_LONG": SignalAction.EXIT_LONG,
    "CLOSE_SHORT": SignalAction.EXIT_SHORT,
  };

  if (directMappings[normalizedAction]) {
    return directMappings[normalizedAction];
  }

  // Custom message matching (if bot has custom messages configured)
  if (bot.enterLongMsg && action.includes(bot.enterLongMsg)) {
    return SignalAction.ENTER_LONG;
  }
  if (bot.exitLongMsg && action.includes(bot.exitLongMsg)) {
    return SignalAction.EXIT_LONG;
  }
  if (bot.enterShortMsg && action.includes(bot.enterShortMsg)) {
    return SignalAction.ENTER_SHORT;
  }
  if (bot.exitShortMsg && action.includes(bot.exitShortMsg)) {
    return SignalAction.EXIT_SHORT;
  }
  if (bot.exitAllMsg && action.includes(bot.exitAllMsg)) {
    return SignalAction.EXIT_ALL;
  }

  return null;
}

// GET endpoint to check webhook status
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
      select: {
        id: true,
        name: true,
        isActive: true,
        webhookUrl: true,
        _count: {
          select: {
            signals: true,
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

    return NextResponse.json({
      botId: bot.id,
      botName: bot.name,
      isActive: bot.isActive,
      webhookUrl: bot.webhookUrl,
      totalSignals: bot._count.signals,
      webhookEndpoint: `${process.env.NEXTAUTH_URL}/api/webhook/signal-bot`,
    });

  } catch (error) {
    console.error("Error fetching bot webhook status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
