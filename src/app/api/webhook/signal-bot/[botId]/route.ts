import db from "@/db";
import { NextRequest, NextResponse } from "next/server";
import { SignalBotWebhookPayload } from "@/types/signal-bot";
import { Action } from "@prisma/client";
import { validateSpotSignal } from "@/lib/fast-signal-bot/validator";
import { executeSpotTrade } from "@/lib/fast-signal-bot/executor";
import { validateMarginSignal } from "@/lib/fast-signal-bot/margin-validator";
import { executeMarginTrade } from "@/lib/fast-signal-bot/margin-executor";
import { getPriceBySymbol } from "@/lib/trading-utils";

/**
 * Webhook Payload Interface (normalized from any format)
 */
interface WebhookPayload {
  action: string;
  symbol: string;
  price?: number;
  message?: string;
  botId?: string;
  botName?: string;
  timeframe?: string;
  exchange?: string;
  format: "json" | "text";
}

/**
 * Parse underscore-separated plain text format
 * Format: ACTION_EXCHANGE_SYMBOL_BOTNAME_TIMEFRAME_BOTID
 * Example: ENTER-LONG_BINANCE_BTCUSDT_Groot_4M_c1d9bfa4-129f-4425-be0a-4e20fb7c5862
 */
function parsePlainTextPayload(text: string): WebhookPayload | null {
  const trimmed = text.trim();
  const parts = trimmed.split("_");

  // Need at least 6 parts: ACTION_EXCHANGE_SYMBOL_BOTNAME_TIMEFRAME_BOTID
  if (parts.length < 6) {
    return null;
  }

  // Extract parts - botId is always the last part (UUID)
  const action = parts[0]; // ENTER-LONG, EXIT-LONG, etc.
  const exchange = parts[1]; // BINANCE (ignored, bot is linked to exchange)
  const symbol = parts[2]; // BTCUSDT
  const botName = parts[3]; // Bot name for logging
  const timeframe = parts[4]; // 4M, 1H, etc. (ignored)

  // Bot ID is everything from position 5 onwards (in case there are underscores in UUID)
  const botId = parts.slice(5).join("_");

  // Validate UUID format loosely (should contain dashes for UUID)
  if (!botId || botId.length < 10) {
    return null;
  }

  return {
    action,
    symbol,
    botId,
    botName,
    timeframe,
    exchange,
    format: "text",
  };
}

/**
 * Parse JSON payload
 */
function parseJsonPayload(json: Record<string, unknown>): WebhookPayload | null {
  const action = json.action as string | undefined;
  const symbol = json.symbol as string | undefined;
  const price = json.price as number | undefined;
  const message = json.message as string | undefined;

  if (!action || !symbol) {
    return null;
  }

  return {
    action,
    symbol,
    price,
    message,
    format: "json",
  };
}

function actionNormalizer(action: string): Action {
  // Normalize action to uppercase and convert to enum
  const normalizedAction = action.toUpperCase().replace(/-/g, "_");
  const actionMap: Record<string, Action> = {
    ENTER_LONG: Action.ENTER_LONG,
    ENTERLONG: Action.ENTER_LONG,
    LONG: Action.ENTER_LONG,
    BUY: Action.ENTER_LONG,

    EXIT_LONG: Action.EXIT_LONG,
    EXITLONG: Action.EXIT_LONG,
    CLOSE_LONG: Action.EXIT_LONG,
    CLOSELONG: Action.EXIT_LONG,
    SELL_LONG: Action.EXIT_LONG,
    SELL: Action.EXIT_LONG,

    ENTER_SHORT: Action.ENTER_SHORT,
    ENTERSHORT: Action.ENTER_SHORT,
    SHORT: Action.ENTER_SHORT,

    EXIT_SHORT: Action.EXIT_SHORT,
    EXITSHORT: Action.EXIT_SHORT,
    CLOSE_SHORT: Action.EXIT_SHORT,
    CLOSESHORT: Action.EXIT_SHORT,
    BUY_SHORT: Action.EXIT_SHORT,
    COVER: Action.EXIT_SHORT,
  };

  const parsedAction = actionMap[normalizedAction];

  if (!parsedAction) {
    throw new Error(
      `Invalid action: "${normalizedAction}" is not a valid action`
    );
  }

  return parsedAction;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ botId: string }> }
) {
  const startTime = Date.now();
  try {
    const { botId } = await params;

    console.log(`=== Webhook Received for Bot: ${botId} ===`);

    // Get the content type and raw body
    const contentType = request.headers.get("content-type") || "";
    const rawBody = await request.text();

    console.log("Content-Type:", contentType);
    console.log("Raw body length:", rawBody.length);

    let payload: WebhookPayload | null = null;

    // Try to parse as JSON first
    if (contentType.includes("application/json") || rawBody.startsWith("{")) {
      try {
        const jsonData = JSON.parse(rawBody);
        payload = parseJsonPayload(jsonData);

        if (!payload) {
          return NextResponse.json(
            {
              error: "Invalid JSON payload",
              details: "Missing required fields: action, symbol",
              example: {
                action: "ENTER_LONG",
                symbol: "BTCUSDT",
                price: 50000
              }
            },
            { status: 400 }
          );
        }
      } catch {
        // JSON parse failed, will try plain text
      }
    }

    // Try plain text format if JSON didn't work
    if (!payload) {
      payload = parsePlainTextPayload(rawBody);

      if (!payload) {
        return NextResponse.json(
          {
            error: "Invalid payload format",
            details: "Could not parse as JSON or plain text",
            formats: {
              json: {
                example: { action: "ENTER_LONG", symbol: "BTCUSDT", price: 50000 }
              },
              plainText: {
                format: "ACTION_EXCHANGE_SYMBOL_BOTNAME_TIMEFRAME_BOTID",
                example: `ENTER-LONG_BINANCE_BTCUSDT_MyBot_4M_${botId}`
              }
            }
          },
          { status: 400 }
        );
      }

      // For plain text format, validate that botId from payload matches URL botId
      if (payload.botId && payload.botId !== botId) {
        return NextResponse.json(
          {
            error: "Bot ID mismatch",
            details: `Bot ID in payload (${payload.botId}) does not match URL bot ID (${botId})`
          },
          { status: 400 }
        );
      }
    }

    console.log("Parsed payload:", {
      ...payload,
      format: payload.format
    });

    const { action, symbol, price, message } = payload;

    const normalizedAction = actionNormalizer(action);
    const normalizedSymbol = symbol.toUpperCase();

    // Get the bot by id from the database
    const bot = await db.bot.findUnique({
      where: {
        id: botId,
        isActive: true,
      },
      include: {
        portfolio: true,
        exchange: true,
      },
    });

    if (!bot) {
      return NextResponse.json({ error: "Bot not found" }, { status: 404 });
    }

    // Validate symbol is in bot's configured symbols
    if (bot.symbols.length > 0 && !bot.symbols.includes(normalizedSymbol)) {
      return NextResponse.json(
        {
          error: "Symbol not configured",
          details: `${normalizedSymbol} is not allowed for this bot`,
          configuredSymbols: bot.symbols,
        },
        { status: 400 }
      );
    }

    // Create signal record
    const signal = await db.signal.create({
      data: {
        botId: bot.id,
        action: normalizedAction,
        symbol: normalizedSymbol,
        price: price || null,
        message: message || null,
        processed: false,
      },
    });

    console.log(`[Webhook] Signal Created: ${signal.id} (${normalizedAction} ${normalizedSymbol})`);

    // Get Current Price (if not provided in payload)
    let currentPrice = price;
    if (!currentPrice) {
      try {
        const p = await getPriceBySymbol({ apiKey: bot.exchange.apiKey, apiSecret: bot.exchange.apiSecret }, normalizedSymbol);
        currentPrice = parseFloat(p.price);
      } catch (e) {
        console.error("Failed to fetch price", e);
        await db.signal.update({
          where: { id: signal.id },
          data: { processed: true, error: "Failed to fetch current price" }
        });
        return NextResponse.json({ error: "Failed to fetch current price" }, { status: 500 });
      }
    }

    console.log(`[Webhook] Current Price: ${currentPrice}`);

    // --- FAST EXECUTION PATH (SPOT & MARGIN) ---
    if (bot.accountType === "SPOT") {
      // 1. Validate Signal (Spot)
      const validation = await validateSpotSignal({
        bot,
        signal,
        currentPrice,
      });

      console.log(`[FastSpot] Validation result: ${validation.success ? "Success" : "Failed"}`, validation.error || "");

      // 2. Execute Trade (Spot)
      const execution = await executeSpotTrade({
        bot,
        signal,
        validation,
      });

      console.log(`[FastSpot] Execution result: ${execution.success ? "Success" : "Failed"}`, execution.error || "");

      // 3. Update Signal Status
      await db.signal.update({
        where: { id: signal.id },
        data: {
          processed: true,
          error: execution.success ? null : execution.error,
          processedAt: new Date(),
        },
      });

      if (execution.success) {
        return NextResponse.json({
          message: "Signal processed successfully (Fast Spot)",
          execution,
        });
      } else {
        return NextResponse.json(
          {
            message: "Signal processing failed (Fast Spot)",
            error: execution.error,
            validationError: validation.error,
          },
          { status: 400 }
        );
      }
    } else if (bot.accountType === "MARGIN") {
      // 1. Validate Signal (Margin)
      const validation = await validateMarginSignal({
        bot,
        signal,
        currentPrice,
      });

      console.log(`[FastMargin] Validation result: ${validation.success ? "Success" : "Failed"}`, validation.error || "");

      // 2. Execute Trade (Margin)
      const execution = await executeMarginTrade({
        bot,
        signal,
        validation,
      });

      console.log(`[FastMargin] Execution result: ${execution.success ? "Success" : "Failed"}`, execution.error || "");

      // 3. Update Signal Status
      await db.signal.update({
        where: { id: signal.id },
        data: {
          processed: true,
          error: execution.success ? null : execution.error,
          processedAt: new Date(),
        },
      });

      if (execution.success) {
        return NextResponse.json({
          message: "Signal processed successfully (Fast Margin)",
          execution,
        });
      } else {
        return NextResponse.json(
          {
            message: "Signal processing failed (Fast Margin)",
            error: execution.error,
            validationError: validation.error,
          },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { error: "Only SPOT and MARGIN account types are supported in this fast route" },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error("Error processing signal:", error);
    return NextResponse.json(
      {
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
