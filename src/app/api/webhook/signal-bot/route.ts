import { NextRequest, NextResponse } from "next/server";
import db from "@/db";
import { processSignal } from "@/lib/signal-bot/signal-processor";
import { Action } from "@prisma/client";

/**
 * Simple Webhook Payload Interface
 */
interface WebhookPayload {
  action: string;
  symbol: string;
  price?: number;
  botId: string;
  secret: string;
}

/**
 * POST /api/webhook/signal-bot
 * 
 * Simplified webhook that accepts JSON payload from TradingView or any source:
 * 
 * {
 *   "action": "ENTER_LONG",
 *   "symbol": "BTCUSDT",
 *   "price": 50000,
 *   "botId": "your-bot-id",
 *   "secret": "your-webhook-secret"
 * }
 * 
 * Actions supported:
 * - ENTER_LONG: Enter a long position
 * - EXIT_LONG: Exit a long position
 * - ENTER_SHORT: Enter a short position
 * - EXIT_SHORT: Exit a short position
 */
export async function POST(request: NextRequest) {
  try {
    console.log("=== Signal Bot Webhook Received ===");

    // Parse the request body as JSON
    let payload: WebhookPayload;
    
    try {
      payload = await request.json();
    } catch (parseError) {
      console.error("Failed to parse JSON:", parseError);
      return NextResponse.json(
        { 
          error: "Invalid JSON payload",
          details: "Request body must be valid JSON",
          example: {
            action: "ENTER_LONG",
            symbol: "BTCUSDT",
            price: 50000,
            botId: "your-bot-id",
            secret: "your-webhook-secret"
          }
        },
        { status: 400 }
      );
    }

    console.log("Webhook payload received:", { ...payload, secret: "***" });

    // Validate required fields
    const { action, symbol, price, botId, secret } = payload;

    if (!action) {
      return NextResponse.json(
        { error: "Missing required field: action" },
        { status: 400 }
      );
    }

    if (!symbol) {
      return NextResponse.json(
        { error: "Missing required field: symbol" },
        { status: 400 }
      );
    }

    if (!botId) {
      return NextResponse.json(
        { error: "Missing required field: botId" },
        { status: 400 }
      );
    }

    if (!secret) {
      return NextResponse.json(
        { error: "Missing required field: secret" },
        { status: 400 }
      );
    }

    // Normalize action to uppercase and convert to enum
    const normalizedAction = action.toUpperCase().replace(/-/g, "_");
    const actionMap: Record<string, Action> = {
      "ENTER_LONG": Action.ENTER_LONG,
      "ENTERLONG": Action.ENTER_LONG,
      "LONG": Action.ENTER_LONG,
      "BUY": Action.ENTER_LONG,
      
      "EXIT_LONG": Action.EXIT_LONG,
      "EXITLONG": Action.EXIT_LONG,
      "CLOSE_LONG": Action.EXIT_LONG,
      "SELL_LONG": Action.EXIT_LONG,
      "SELL": Action.EXIT_LONG,
      
      "ENTER_SHORT": Action.ENTER_SHORT,
      "ENTERSHORT": Action.ENTER_SHORT,
      "SHORT": Action.ENTER_SHORT,
      
      "EXIT_SHORT": Action.EXIT_SHORT,
      "EXITSHORT": Action.EXIT_SHORT,
      "CLOSE_SHORT": Action.EXIT_SHORT,
      "BUY_SHORT": Action.EXIT_SHORT,
      "COVER": Action.EXIT_SHORT,
    };

    const parsedAction = actionMap[normalizedAction];
    
    if (!parsedAction) {
      return NextResponse.json(
        { 
          error: "Invalid action",
          details: `"${action}" is not a valid action`,
          supportedActions: [
            "ENTER_LONG (or BUY, LONG)",
            "EXIT_LONG (or SELL, CLOSE_LONG)",
            "ENTER_SHORT (or SHORT)",
            "EXIT_SHORT (or COVER, CLOSE_SHORT)"
          ]
        },
        { status: 400 }
      );
    }

    // Normalize symbol to uppercase
    const normalizedSymbol = symbol.toUpperCase();

    // Find the bot by ID
    const bot = await db.bot.findUnique({
      where: { id: botId },
      include: {
        exchange: true,
        portfolio: true,
      },
    });

    if (!bot) {
      console.error("Bot not found for ID:", botId);
      return NextResponse.json(
        { 
          error: "Bot not found",
          details: "No bot exists with this ID. Please check your botId."
        },
        { status: 404 }
      );
    }

    // Verify webhook secret
    if (bot.webhookSecret !== secret) {
      console.error("Invalid webhook secret for bot:", bot.id);
      return NextResponse.json(
        { 
          error: "Invalid webhook secret",
          details: "The provided secret does not match the bot's webhook secret"
        },
        { status: 401 }
      );
    }

    if (!bot.isActive) {
      console.error("Bot is not active:", bot.id);
      return NextResponse.json(
        { 
          error: "Bot is not active",
          details: "This bot has been disabled. Enable it in the dashboard to receive signals."
        },
        { status: 400 }
      );
    }

    console.log("Bot verified:", { id: bot.id, name: bot.name, isActive: bot.isActive });

    // Validate symbol is in bot's configured symbols
    if (bot.symbols.length > 0 && !bot.symbols.includes(normalizedSymbol)) {
      console.error(`Symbol ${normalizedSymbol} not configured for bot`);
      return NextResponse.json(
        { 
          error: "Symbol not configured",
          details: `Symbol ${normalizedSymbol} is not in the bot's allowed symbols`,
          configuredSymbols: bot.symbols
        },
        { status: 400 }
      );
    }

    // Validate action is compatible with account type
    if (bot.accountType === "SPOT") {
      // SPOT accounts cannot short
      if (parsedAction === Action.ENTER_SHORT || parsedAction === Action.EXIT_SHORT) {
        return NextResponse.json(
          { 
            error: "Invalid action for SPOT account",
            details: "Shorting is not available for SPOT trading accounts. Use MARGIN account type for short positions.",
            accountType: "SPOT",
            suggestedActions: ["ENTER_LONG", "EXIT_LONG"]
          },
          { status: 400 }
        );
      }
    }

    // Validate exchange is active
    if (!bot.exchange.isActive) {
      return NextResponse.json(
        { 
          error: "Exchange not active",
          details: "The bot's exchange is not active. Please check the exchange configuration."
        },
        { status: 400 }
      );
    }

    // Get current price if not provided in payload
    let currentPrice = price;
    if (!currentPrice) {
      try {
        const { getPriceBySymbol } = await import("@/lib/trading-utils");
        const configurationRestAPI = {
          apiKey: bot.exchange.apiKey,
          apiSecret: bot.exchange.apiSecret,
        };
        const priceData = await getPriceBySymbol(configurationRestAPI, normalizedSymbol);
        
        // Parse price from various formats
        if (typeof priceData === 'object' && 'price' in priceData) {
          currentPrice = parseFloat(priceData.price as string);
        } else if (typeof priceData === 'string') {
          currentPrice = parseFloat(priceData);
        } else if (typeof priceData === 'number') {
          currentPrice = priceData;
        }
        
        console.log("Current price fetched:", currentPrice);
      } catch (priceError) {
        console.error("Error fetching current price:", priceError);
        // Continue without price - will be null in signal
      }
    }

    // Create the signal record
    const signal = await db.signal.create({
      data: {
        botId: bot.id,
        action: parsedAction,
        symbol: normalizedSymbol,
        price: currentPrice || null,
        message: JSON.stringify(payload),
        processed: false,
      },
    });

    console.log(`Signal created: ${signal.id} - ${parsedAction} ${normalizedSymbol} @ ${currentPrice || 'market'}`);

    // Process the signal
    try {
      const processingResult = await processSignal(signal.id);
      console.log("Signal processing result:", processingResult);

      if (processingResult.success) {
        return NextResponse.json({
          success: true,
          signalId: signal.id,
          positionId: processingResult.positionId,
          action: parsedAction,
          symbol: normalizedSymbol,
          price: currentPrice,
          botName: bot.name,
          message: processingResult.message || "Signal processed successfully",
        }, { status: 200 });
      } else {
        return NextResponse.json({
          success: false,
          signalId: signal.id,
          action: parsedAction,
          symbol: normalizedSymbol,
          botName: bot.name,
          error: processingResult.error,
          skipped: processingResult.skipped,
          skipReason: processingResult.skipReason,
        }, { status: processingResult.skipped ? 200 : 400 });
      }
    } catch (processingError) {
      console.error("Signal processing failed:", processingError);
      
      // Update signal with error
      await db.signal.update({
        where: { id: signal.id },
        data: {
          processed: true,
          error: processingError instanceof Error ? processingError.message : "Processing failed",
        },
      });

      return NextResponse.json({
        success: false,
        signalId: signal.id,
        action: parsedAction,
        symbol: normalizedSymbol,
        error: processingError instanceof Error ? processingError.message : "Processing failed",
      }, { status: 500 });
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

/**
 * GET /api/webhook/signal-bot?botId=BOT_ID
 * 
 * Get webhook information and status for a bot
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const botId = url.searchParams.get("botId");

  if (!botId) {
    return NextResponse.json(
      { error: "Bot ID is required in query params" },
      { status: 400 }
    );
  }

  try {
    const bot = await db.bot.findUnique({
      where: { id: botId },
      include: {
        _count: {
          select: {
            signals: true,
            positions: true,
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
    const webhookEndpoint = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhook/signal-bot`;
    
    // Get recent signals for status
    const recentSignals = await db.signal.findMany({
      where: { botId: bot.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        action: true,
        symbol: true,
        price: true,
        processed: true,
        error: true,
        createdAt: true,
      },
    });

    // Generate example payloads
    const generateExamplePayload = (action: string) => ({
      action,
      symbol: bot.symbols[0] || "BTCUSDT",
      price: action.includes("LONG") ? 50000 : 3000, // Example prices
      botId: bot.id,
      secret: bot.webhookSecret
    });

    return NextResponse.json({
      // Basic bot info
      botId: bot.id,
      botName: bot.name,
      isActive: bot.isActive,
      
      // Webhook configuration
      webhookEndpoint,
      webhookSecret: bot.webhookSecret,
      
      // Bot configuration summary
      configuration: {
        symbols: bot.symbols,
        accountType: bot.accountType,
        marginType: bot.marginType,
        sideEffectType: bot.sideEffectType,
        autoRepay: bot.autoRepay,
        maxBorrowPercent: bot.maxBorrowPercent,
        orderType: bot.orderType,
        portfolioPercent: bot.positionPercent,
        leverage: bot.leverage,
        stopLoss: bot.stopLoss,
        takeProfit: bot.takeProfit,
      },
      
      // Statistics
      statistics: {
        totalSignals: bot._count.signals,
        totalPositions: bot._count.positions,
        totalTrades: bot.totalTrades,
        winTrades: bot.winTrades,
        lossTrades: bot.lossTrades,
        totalPnl: bot.totalPnl,
        winRate: bot.totalTrades > 0 ? (bot.winTrades / bot.totalTrades) * 100 : 0,
      },
      
      // Recent activity
      recentSignals: recentSignals.map(signal => ({
        id: signal.id,
        action: signal.action,
        symbol: signal.symbol,
        price: signal.price,
        processed: signal.processed,
        hasError: !!signal.error,
        error: signal.error,
        timestamp: signal.createdAt,
      })),
      
      // Simplified webhook setup
      testingInfo: {
        description: "Simple JSON webhook payload format that works with any platform",
        examplePayload: generateExamplePayload("ENTER_LONG"),
        allExamples: {
          enterLong: generateExamplePayload("ENTER_LONG"),
          exitLong: generateExamplePayload("EXIT_LONG"),
          enterShort: generateExamplePayload("ENTER_SHORT"),
          exitShort: generateExamplePayload("EXIT_SHORT"),
        },
        tradingViewExample: {
          description: "For TradingView, use this in your alert message:",
          payload: JSON.stringify(generateExamplePayload("{{strategy.order.action}}"), null, 2),
          dynamicPrice: "Use {{close}} or {{strategy.order.price}} for dynamic price"
        },
        curlExample: {
          description: "For curl, use this command:",
          command: `curl -X POST ${webhookEndpoint} \\
            -H "Content-Type: application/json" \\
            -d '${JSON.stringify(generateExamplePayload("ENTER_LONG"), null, 2)}'`
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
