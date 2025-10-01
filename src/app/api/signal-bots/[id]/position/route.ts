import { NextRequest, NextResponse } from "next/server";
import db from "@/db";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { placeOrder } from "@/db/actions/order/create-order";
import { updatePosition } from "@/db/actions/position/update-position";
import {
  calculatePositionQuantity,
  adjustQuantityToConstraints,
  validateOrderBalance,
  calculateExitPrices,
  extractBaseAsset,
} from "@/lib/utils";
import {
  getBalance,
  getPriceBySymbol,
  tradingPairInfo,
} from "@/lib/trading-utils";
import { extractTradingConstraints } from "@/lib/trading-constraints";

// Schema for manual position creation
const createPositionSchema = z.object({
  side: z.enum(["Long", "Short"]),
  symbol: z.string(),
  customQuantity: z.number().positive().optional(),
});

type PositionSide = "Long" | "Short";
type ExchangeConfig = { apiKey: string; apiSecret: string };

// ========== HELPER FUNCTIONS ==========

/**
 * Validates user authentication and returns portfolio
 */
async function getUserPortfolio(userId: string) {
  const portfolio = await db.portfolio.findFirst({
    where: { userId },
  });

  if (!portfolio) {
    throw new Error("User account not found");
  }

  return portfolio;
}

/**
 * Validates and retrieves signal bot with exchange details
 */
async function getSignalBot(botId: string, portfolioId: string) {
  const signalBot = await db.bot.findFirst({
    where: { id: botId, portfolioId },
    include: { exchange: true },
  });

  if (!signalBot) {
    throw new Error("Signal bot not found");
  }

  if (!signalBot.isActive) {
    throw new Error("Signal bot is not active");
  }

  return signalBot;
}

/**
 * Validates if symbol is configured for the bot
 */
function validateBotSymbol(symbols: string[], symbol: string) {
  if (!symbols.includes(symbol)) {
    throw new Error(
      `Symbol ${symbol} is not configured for this bot. Configured symbols: ${symbols.join(
        ", "
      )}`
    );
  }
}

/**
 * Creates position and order in database
 */
async function createPositionAndOrder(
  portfolioId: string,
  botId: string,
  symbol: string,
  side: PositionSide,
  quantity: number,
  currentPrice: number,
  stopLossPrice: number | null,
  takeProfitPrice: number | null
) {
  const entryValue = currentPrice * quantity;
  const dbSide = side === "Long" ? "LONG" : "SHORT";
  const orderSide = side === "Long" ? "BUY" : "SELL";

  console.log("creating position: ", {
    portfolioId,
    botId,
    symbol,
    side: dbSide,
    status: "OPEN",
    entryPrice: currentPrice,
    quantity,
    entryValue,
    type: "MARKET",
    stopLoss: stopLossPrice,
    takeProfit: takeProfitPrice,
    createdAt: new Date(),
    source: "BOT",
  });

  const position = await db.position.create({
    data: {
      portfolioId,
      botId,
      symbol,
      side: dbSide,
      status: "OPEN",
      entryPrice: currentPrice,
      quantity,
      entryValue,
      currentPrice: currentPrice,
      type: "MARKET",
      stopLoss: stopLossPrice,
      takeProfit: takeProfitPrice,
      createdAt: new Date(),
      source: "BOT",
    },
  });

  console.log("position created: ", position);

  const order = await db.order.create({
    data: {
      positionId: position.id,
      portfolioId,
      orderId: "",
      symbol,
      type: "ENTRY",
      side: orderSide,
      orderType: "MARKET",
      price: currentPrice,
      quantity,
      value: entryValue,
      status: "NEW",
      fillPercent: 0,
      pnl: 0,
    },
  });

  console.log("order created: ", order);

  return { position, order };
}

/**
 * Fetches current price and trading constraints
 */
export async function getMarketData(config: ExchangeConfig, symbol: string) {
  const [priceData, exchangeInfo] = await Promise.all([
    getPriceBySymbol(config, symbol),
    tradingPairInfo(config, symbol),
  ]);

  const currentPrice = parseFloat(
    (priceData as unknown as { price: string }).price
  );

  if (!currentPrice || currentPrice <= 0) {
    throw new Error("Unable to fetch current price for symbol");
  }

  const constraints = extractTradingConstraints(exchangeInfo, symbol);

  if (!constraints) {
    throw new Error("Unable to get trading constraints for symbol");
  }

  return { currentPrice, constraints };
}

/**
 * Gets available balance for the required asset
 */
export async function getAvailableBalance(
  config: ExchangeConfig,
  symbol: string,
  side: PositionSide
) {
  const baseAsset = extractBaseAsset(symbol);
  const quoteAsset = symbol.replace(baseAsset, "");
  const requiredAsset = side === "Long" ? quoteAsset : baseAsset;

  const allBalances = await getBalance(config);

  if (!allBalances || allBalances.length === 0) {
    throw new Error(
      "No balances found. Please fund your account to create positions."
    );
  }

  const assetBalance = allBalances.find(
    (balance) => balance.asset === requiredAsset
  );

  if (!assetBalance) {
    throw new Error(
      `No ${requiredAsset} balance found for ${
        side === "Long" ? "buying" : "selling"
      } ${symbol}`
    );
  }

  const availableBalance = parseFloat(assetBalance.free || "0");

  if (availableBalance <= 0) {
    throw new Error(
      `Insufficient ${requiredAsset} balance (${availableBalance}). Please fund your account.`
    );
  }

  console.log(`Available ${requiredAsset} balance: ${availableBalance}`);

  return { availableBalance, baseAsset, quoteAsset, requiredAsset };
}

/**
 * Executes order on exchange and updates database
 */
async function executeOrder(
  config: ExchangeConfig,
  symbol: string,
  side: PositionSide,
  quantity: number,
  positionId: string,
  orderId: string
) {
  const orderSide = side === "Long" ? "BUY" : "SELL";

  const result = await placeOrder(
    {
      symbol,
      side: orderSide,
      type: "MARKET",
      quantity: quantity.toString(),
    },
    config
  );

  if (result.success && result.data) {
    await updatePosition({
      positionId,
      orderId,
      binanceResponse: result.data,
    });

    return result;
  } else {
    // Clean up on failure
    await db.position
      .delete({ where: { id: positionId } })
      .catch(console.error);
    await db.order.delete({ where: { id: orderId } }).catch(console.error);

    throw new Error(result.message || "Failed to place order");
  }
}

/**
 * Updates bot statistics
 */
async function updateBotStats(botId: string) {
  await db.bot.update({
    where: { id: botId },
    data: { totalTrades: { increment: 1 } },
  });
}

// ========== MAIN ROUTE HANDLER ==========

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: botId } = await params;

    // Authenticate user
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate request body
    const body = await request.json();
    const validatedData = createPositionSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: validatedData.error.issues },
        { status: 400 }
      );
    }

    const { side, symbol, customQuantity } = validatedData.data;

    // Get user portfolio
    const portfolio = await getUserPortfolio(session.user.id);

    // Get and validate signal bot
    const signalBot = await getSignalBot(botId, portfolio.id);
    validateBotSymbol(signalBot.symbols, symbol);

    // Exchange configuration
    const config: ExchangeConfig = {
      apiKey: signalBot.exchange.apiKey,
      apiSecret: signalBot.exchange.apiSecret,
    };

    // Get market data
    const { currentPrice, constraints } = await getMarketData(config, symbol);

    // Get available balance
    const { availableBalance, baseAsset, quoteAsset, requiredAsset } =
      await getAvailableBalance(config, symbol, side);

    console.log(`Trading ${symbol}: ${baseAsset}/${quoteAsset}, Side: ${side}`);

    // Calculate position quantity
    const rawQuantity = calculatePositionQuantity(
      side,
      availableBalance,
      currentPrice,
      signalBot.positionPercent,
      customQuantity
    );

    // Adjust quantity to meet constraints
    const quantity = adjustQuantityToConstraints(
      rawQuantity,
      currentPrice,
      constraints
    );

    // Validate sufficient balance
    validateOrderBalance(
      side,
      quantity,
      currentPrice,
      availableBalance,
      requiredAsset
    );

    // Calculate exit prices
    const { stopLossPrice, takeProfitPrice } = calculateExitPrices(
      side,
      currentPrice,
      signalBot.stopLoss,
      signalBot.takeProfit
    );

    console.log("position data: ", {
      side,
      symbol,
      quantity,
      currentPrice,
      stopLossPrice,
      takeProfitPrice,
      availableBalance,
      baseAsset,
      quoteAsset,
      requiredAsset,
      constraints,
      rawQuantity,
    });

    // Create position and order
    const { position, order } = await createPositionAndOrder(
      portfolio.id,
      signalBot.id,
      symbol,
      side,
      quantity,
      currentPrice,
      stopLossPrice,
      takeProfitPrice
    );

    // Execute order on exchange
    await executeOrder(config, symbol, side, quantity, position.id, order.id);

    // Update bot statistics
    await updateBotStats(botId);

    return NextResponse.json(
      {
        success: true,
        position: {
          id: position.id,
          symbol: position.symbol,
          side: position.side,
          entryPrice: position.entryPrice,
          quantity: position.quantity,
          entryValue: position.entryValue,
          stopLoss: position.stopLoss,
          takeProfit: position.takeProfit,
          status: position.status,
          entryTime: position.createdAt,
        },
        message: `${side} position created for ${symbol} at $${currentPrice.toFixed(
          4
        )}`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating position:", error);

    const message =
      error instanceof Error ? error.message : "Failed to create position";
    const status = message.includes("not found")
      ? 404
      : message.includes("Unauthorized")
      ? 401
      : message.includes("Insufficient") || message.includes("not configured")
      ? 400
      : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
