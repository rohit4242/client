import { NextRequest, NextResponse } from "next/server";
import db from "@/db";
import { processSignal } from "@/lib/signal-bot/signal-processor";
import { validateWebhookPayload, parseTradingViewAlert } from "@/lib/signal-bot/signal-validator";

/**
 * POST /api/webhook/signal-bot
 * 
 * Receives TradingView alerts in the format:
 * ACTION_EXCHANGE_SYMBOL_BOTNAME_TIMEFRAME_BOTID
 * 
 * Example: "ENTER-LONG_BINANCE_BTCUSDT_BOT-NAME-TV8BuH_5M_afdfe842b36b842f4ab2a95"
 * 
 * Parsed as:
 * - action: ENTER-LONG
 * - exchange: BINANCE
 * - symbol: BTCUSDT
 * - botName: BOT-NAME-TV8BuH
 * - timeframe: 5M
 * - botId: afdfe842b36b842f4ab2a95
 * 
 * Actions supported:
 * - ENTER-LONG: Enter a long position
 * - EXIT-LONG: Exit a long position
 * - ENTER-SHORT: Enter a short position
 * - EXIT-SHORT: Exit a short position
 */
export async function POST(request: NextRequest) {
  try {
    console.log("=== TradingView Signal Bot Webhook Received ===");

    // Parse the TradingView alert message
    const body = await request.text();
    console.log("Raw TradingView alert:", body);

    // Validate and parse the alert format
    const parseResult = parseTradingViewAlert(body);
    
    if (!parseResult.success) {
      console.error("Invalid alert format:", parseResult.error);
      return NextResponse.json(
        { 
          error: "Invalid alert format", 
          details: parseResult.error,
          expectedFormat: "ACTION_EXCHANGE_SYMBOL_BOTNAME_TIMEFRAME_BOTID",
          example: "ENTER-LONG_BINANCE_BTCUSDT_MyBot_5M_abc123"
        },
        { status: 400 }
      );
    }

    const { action, exchange, symbol, botName, timeframe, botId } = parseResult.data!;
    console.log("Parsed alert:", { action, exchange, symbol, botName, timeframe, botId });

    // Find the bot by ID
    const bot = await db.bot.findUnique({
      where: {
        id: botId,
      },
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
          botId: botId,
          details: "No bot exists with this ID. Please check your alert message."
        },
        { status: 404 }
      );
    }

    if (!bot.isActive) {
      console.error("Bot is not active:", bot.id);
      return NextResponse.json(
        { 
          error: "Bot is not active",
          botId: bot.id,
          botName: bot.name
        },
        { status: 400 }
      );
    }

    console.log("Bot found:", { id: bot.id, name: bot.name, isActive: bot.isActive });

    // Validate the webhook payload
    const validationResult = validateWebhookPayload(bot, symbol, action);
    
    if (!validationResult.success) {
      console.error("Validation failed:", validationResult.errors);
      return NextResponse.json(
        { 
          error: "Webhook validation failed", 
          details: validationResult.errors,
          botId: bot.id,
          symbol: symbol
        },
        { status: 400 }
      );
    }

    // Get current price for the symbol
    let currentPrice: number | null = null;
    try {
      const { getPriceBySymbol } = await import("@/lib/trading-utils");
      const configurationRestAPI = {
        apiKey: bot.exchange.apiKey,
        apiSecret: bot.exchange.apiSecret,
      };
      const priceData = await getPriceBySymbol(configurationRestAPI, symbol);
      
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

    // Create the signal record with timeframe metadata
    const signal = await db.signal.create({
      data: {
        botId: bot.id,
        action: action,
        symbol: symbol,
        price: currentPrice,
        message: body,
        processed: false,
      },
    });

    console.log(`Signal created: ${signal.id} - ${action} ${symbol} @ ${currentPrice} [${timeframe}]`);

    // Process the signal
    try {
      const processingResult = await processSignal(signal.id);
      console.log("Signal processing result:", processingResult);

      if (processingResult.success) {
        return NextResponse.json({
          success: true,
          signalId: signal.id,
          positionId: processingResult.positionId,
          action: action,
          symbol: symbol,
          price: currentPrice,
          timeframe: timeframe,
          botName: botName,
          message: processingResult.message || "Signal processed successfully",
        }, { status: 200 });
      } else {
        return NextResponse.json({
          success: false,
          signalId: signal.id,
          action: action,
          symbol: symbol,
          timeframe: timeframe,
          botName: botName,
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
        action: action,
        symbol: symbol,
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

    // Generate alert message templates with actual bot ID
    const generateAlertTemplate = (action: string, symbol: string = "{{ticker}}", timeframe: string = "{{interval}}") => {
      return `${action}_BINANCE_${symbol}_${bot.name}_${timeframe}_${bot.id}`;
    };

    return NextResponse.json({
      // Basic bot info
      botId: bot.id,
      botName: bot.name,
      isActive: bot.isActive,
      
      // Webhook configuration
      webhookUrl: webhookEndpoint,
      
      // Bot configuration summary
      configuration: {
        symbols: bot.symbols,
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
      
      // TradingView webhook setup
      tradingViewSetup: {
        webhookUrl: webhookEndpoint,
        alertMessageFormat: {
          description: "ACTION_EXCHANGE_SYMBOL_BOTNAME_TIMEFRAME_BOTID",
          enterLong: generateAlertTemplate("ENTER-LONG"),
          exitLong: generateAlertTemplate("EXIT-LONG"),
          enterShort: generateAlertTemplate("ENTER-SHORT"),
          exitShort: generateAlertTemplate("EXIT-SHORT"),
        },
        exampleMessages: {
          description: "Actual examples with your bot ID",
          enterLong: generateAlertTemplate("ENTER-LONG", bot.symbols[0] || 'BTCUSDT', '5M'),
          exitLong: generateAlertTemplate("EXIT-LONG", bot.symbols[0] || 'BTCUSDT', '5M'),
          enterShort: generateAlertTemplate("ENTER-SHORT", bot.symbols[0] || 'BTCUSDT', '15M'),
          exitShort: generateAlertTemplate("EXIT-SHORT", bot.symbols[0] || 'BTCUSDT', '15M'),
        },
        pineScriptExample: {
          enterLong: `strategy.entry("Long", strategy.long, alert_message="${generateAlertTemplate("ENTER-LONG", "{{ticker}}", "{{interval}}")}")`,
          exitLong: `strategy.close("Long", alert_message="${generateAlertTemplate("EXIT-LONG", "{{ticker}}", "{{interval}}")}")`,
          enterShort: `strategy.entry("Short", strategy.short, alert_message="${generateAlertTemplate("ENTER-SHORT", "{{ticker}}", "{{interval}}")}")`,
          exitShort: `strategy.close("Short", alert_message="${generateAlertTemplate("EXIT-SHORT", "{{ticker}}", "{{interval}}")}")`,
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