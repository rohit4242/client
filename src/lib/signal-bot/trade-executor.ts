import db from "@/db";
import type { Bot, Signal } from "@prisma/client";
import { validatePositionParams } from "./signal-validator";

/**
 * Trade execution context
 */
export interface TradeExecutionContext {
  bot: Bot & {
    exchange: {
      id: string;
      apiKey: string;
      apiSecret: string;
      totalValue: string;
      isActive: boolean;
    };
    portfolio: {
      id: string;
    };
  };
  signal: Signal;
  currentPrice: number;
}

/**
 * Trade execution result
 */
export interface TradeExecutionResult {
  success: boolean;
  positionId?: string;
  orderId?: string;
  message?: string;
  error?: string;
  skipped?: boolean;
  skipReason?: string;
}

/**
 * Execute ENTER_LONG action
 * Creates a new LONG position
 */
export async function executeEnterLong(
  context: TradeExecutionContext
): Promise<TradeExecutionResult> {
  const { bot, signal, currentPrice } = context;

  try {
    console.log(`Executing ENTER_LONG for ${signal.symbol}`);

    // Check if there's already an open LONG position for this symbol and bot
    const existingPosition = await db.position.findFirst({
      where: {
        portfolioId: bot.portfolioId,
        botId: bot.id,
        symbol: signal.symbol,
        side: "LONG",
        status: "OPEN",
      },
    });

    if (existingPosition) {
      return {
        success: false,
        skipped: true,
        skipReason: `Already have an open LONG position for ${signal.symbol}`,
      };
    }

    // Calculate position size based on portfolio percentage
    const portfolioValue = parseFloat(bot.exchange.totalValue) || 0;
    
    if (portfolioValue <= 0) {
      throw new Error("Invalid portfolio value. Please sync your exchange.");
    }

    const positionValue = (portfolioValue * bot.positionPercent) / 100;
    const quantity = positionValue / currentPrice;

    // Apply leverage if configured
    const leveragedQuantity = quantity * (bot.leverage || 1);

    // Calculate stop loss and take profit
    const stopLoss = bot.stopLoss 
      ? currentPrice * (1 - bot.stopLoss / 100) 
      : null;
    
    const takeProfit = bot.takeProfit 
      ? currentPrice * (1 + bot.takeProfit / 100) 
      : null;

    // Validate position parameters
    const validation = validatePositionParams({
      quantity: leveragedQuantity,
      entryPrice: currentPrice,
      stopLoss,
      takeProfit,
      side: 'LONG',
    });

    if (!validation.success) {
      throw new Error(`Position validation failed: ${validation.errors.join(', ')}`);
    }

    // Create position
    const position = await db.position.create({
      data: {
        portfolioId: bot.portfolioId,
        botId: bot.id,
        symbol: signal.symbol,
        side: "LONG",
        type: bot.orderType === "Market" ? "MARKET" : "LIMIT",
        entryPrice: currentPrice,
        quantity: leveragedQuantity,
        entryValue: positionValue,
        currentPrice: currentPrice,
        stopLoss,
        takeProfit,
        source: "BOT",
        status: "OPEN",
      },
    });

    console.log(`Position created: ${position.id}`);

    // Create entry order
    const order = await db.order.create({
      data: {
        positionId: position.id,
        portfolioId: bot.portfolioId,
        orderId: `BOT-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        symbol: signal.symbol,
        type: "ENTRY",
        side: "BUY",
        orderType: bot.orderType === "Market" ? "MARKET" : "LIMIT",
        price: currentPrice,
        quantity: leveragedQuantity,
        value: positionValue,
        status: "FILLED",
        fillPercent: 100,
        pnl: 0,
      },
    });

    console.log(`Entry order created: ${order.id}`);

    // Update bot stats
    await db.bot.update({
      where: { id: bot.id },
      data: {
        totalTrades: { increment: 1 },
      },
    });

    return {
      success: true,
      positionId: position.id,
      orderId: order.id,
      message: `LONG position opened for ${signal.symbol} at ${currentPrice}`,
    };

  } catch (error) {
    console.error("Error executing ENTER_LONG:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Execute EXIT_LONG action
 * Closes an existing LONG position
 */
export async function executeExitLong(
  context: TradeExecutionContext
): Promise<TradeExecutionResult> {
  const { bot, signal, currentPrice } = context;

  try {
    console.log(`Executing EXIT_LONG for ${signal.symbol}`);

    // Find open LONG position
    const position = await db.position.findFirst({
      where: {
        portfolioId: bot.portfolioId,
        botId: bot.id,
        symbol: signal.symbol,
        side: "LONG",
        status: "OPEN",
      },
    });

    if (!position) {
      return {
        success: false,
        skipped: true,
        skipReason: `No open LONG position found for ${signal.symbol}`,
      };
    }

    // Calculate P&L
    const exitValue = position.quantity * currentPrice;
    const pnl = exitValue - position.entryValue;
    const pnlPercent = (pnl / position.entryValue) * 100;

    console.log(`Closing position: Entry=${position.entryPrice}, Exit=${currentPrice}, P&L=${pnl.toFixed(2)} (${pnlPercent.toFixed(2)}%)`);

    // Update position
    const updatedPosition = await db.position.update({
      where: { id: position.id },
      data: {
        exitPrice: currentPrice,
        exitValue: exitValue,
        pnl: pnl,
        pnlPercent: pnlPercent,
        status: "CLOSED",
        currentPrice: currentPrice,
      },
    });

    // Create exit order
    const order = await db.order.create({
      data: {
        positionId: position.id,
        portfolioId: bot.portfolioId,
        orderId: `BOT-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        symbol: signal.symbol,
        type: "EXIT",
        side: "SELL",
        orderType: bot.orderType === "Market" ? "MARKET" : "LIMIT",
        price: currentPrice,
        quantity: position.quantity,
        value: exitValue,
        status: "FILLED",
        fillPercent: 100,
        pnl: pnl,
      },
    });

    console.log(`Exit order created: ${order.id}`);

    // Update bot stats
    await db.bot.update({
      where: { id: bot.id },
      data: {
        totalPnl: { increment: pnl },
        winTrades: pnl > 0 ? { increment: 1 } : undefined,
      },
    });

    return {
      success: true,
      positionId: updatedPosition.id,
      orderId: order.id,
      message: `LONG position closed for ${signal.symbol} at ${currentPrice}. P&L: ${pnl.toFixed(2)} (${pnlPercent.toFixed(2)}%)`,
    };

  } catch (error) {
    console.error("Error executing EXIT_LONG:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Execute ENTER_SHORT action
 * Creates a new SHORT position
 */
export async function executeEnterShort(
  context: TradeExecutionContext
): Promise<TradeExecutionResult> {
  const { bot, signal, currentPrice } = context;

  try {
    console.log(`Executing ENTER_SHORT for ${signal.symbol}`);

    // Check if there's already an open SHORT position for this symbol and bot
    const existingPosition = await db.position.findFirst({
      where: {
        portfolioId: bot.portfolioId,
        botId: bot.id,
        symbol: signal.symbol,
        side: "SHORT",
        status: "OPEN",
      },
    });

    if (existingPosition) {
      return {
        success: false,
        skipped: true,
        skipReason: `Already have an open SHORT position for ${signal.symbol}`,
      };
    }

    // Calculate position size based on portfolio percentage
    const portfolioValue = parseFloat(bot.exchange.totalValue) || 0;
    
    if (portfolioValue <= 0) {
      throw new Error("Invalid portfolio value. Please sync your exchange.");
    }

    const positionValue = (portfolioValue * bot.positionPercent) / 100;
    const quantity = positionValue / currentPrice;

    // Apply leverage if configured
    const leveragedQuantity = quantity * (bot.leverage || 1);

    // Calculate stop loss and take profit (inverse for SHORT)
    const stopLoss = bot.stopLoss 
      ? currentPrice * (1 + bot.stopLoss / 100) 
      : null;
    
    const takeProfit = bot.takeProfit 
      ? currentPrice * (1 - bot.takeProfit / 100) 
      : null;

    // Validate position parameters
    const validation = validatePositionParams({
      quantity: leveragedQuantity,
      entryPrice: currentPrice,
      stopLoss,
      takeProfit,
      side: 'SHORT',
    });

    if (!validation.success) {
      throw new Error(`Position validation failed: ${validation.errors.join(', ')}`);
    }

    // Create position
    const position = await db.position.create({
      data: {
        portfolioId: bot.portfolioId,
        botId: bot.id,
        symbol: signal.symbol,
        side: "SHORT",
        type: bot.orderType === "Market" ? "MARKET" : "LIMIT",
        entryPrice: currentPrice,
        quantity: leveragedQuantity,
        entryValue: positionValue,
        currentPrice: currentPrice,
        stopLoss,
        takeProfit,
        source: "BOT",
        status: "OPEN",
      },
    });

    console.log(`Position created: ${position.id}`);

    // Create entry order (SELL for SHORT)
    const order = await db.order.create({
      data: {
        positionId: position.id,
        portfolioId: bot.portfolioId,
        orderId: `BOT-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        symbol: signal.symbol,
        type: "ENTRY",
        side: "SELL",
        orderType: bot.orderType === "Market" ? "MARKET" : "LIMIT",
        price: currentPrice,
        quantity: leveragedQuantity,
        value: positionValue,
        status: "FILLED",
        fillPercent: 100,
        pnl: 0,
      },
    });

    console.log(`Entry order created: ${order.id}`);

    // Update bot stats
    await db.bot.update({
      where: { id: bot.id },
      data: {
        totalTrades: { increment: 1 },
      },
    });

    return {
      success: true,
      positionId: position.id,
      orderId: order.id,
      message: `SHORT position opened for ${signal.symbol} at ${currentPrice}`,
    };

  } catch (error) {
    console.error("Error executing ENTER_SHORT:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Execute EXIT_SHORT action
 * Closes an existing SHORT position
 */
export async function executeExitShort(
  context: TradeExecutionContext
): Promise<TradeExecutionResult> {
  const { bot, signal, currentPrice } = context;

  try {
    console.log(`Executing EXIT_SHORT for ${signal.symbol}`);

    // Find open SHORT position
    const position = await db.position.findFirst({
      where: {
        portfolioId: bot.portfolioId,
        botId: bot.id,
        symbol: signal.symbol,
        side: "SHORT",
        status: "OPEN",
      },
    });

    if (!position) {
      return {
        success: false,
        skipped: true,
        skipReason: `No open SHORT position found for ${signal.symbol}`,
      };
    }

    // Calculate P&L (inverse for SHORT)
    const exitValue = position.quantity * currentPrice;
    const pnl = position.entryValue - exitValue; // Profit when price goes down
    const pnlPercent = (pnl / position.entryValue) * 100;

    console.log(`Closing position: Entry=${position.entryPrice}, Exit=${currentPrice}, P&L=${pnl.toFixed(2)} (${pnlPercent.toFixed(2)}%)`);

    // Update position
    const updatedPosition = await db.position.update({
      where: { id: position.id },
      data: {
        exitPrice: currentPrice,
        exitValue: exitValue,
        pnl: pnl,
        pnlPercent: pnlPercent,
        status: "CLOSED",
        currentPrice: currentPrice,
      },
    });

    // Create exit order (BUY for SHORT)
    const order = await db.order.create({
      data: {
        positionId: position.id,
        portfolioId: bot.portfolioId,
        orderId: `BOT-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        symbol: signal.symbol,
        type: "EXIT",
        side: "BUY",
        orderType: bot.orderType === "Market" ? "MARKET" : "LIMIT",
        price: currentPrice,
        quantity: position.quantity,
        value: exitValue,
        status: "FILLED",
        fillPercent: 100,
        pnl: pnl,
      },
    });

    console.log(`Exit order created: ${order.id}`);

    // Update bot stats
    await db.bot.update({
      where: { id: bot.id },
      data: {
        totalPnl: { increment: pnl },
        winTrades: pnl > 0 ? { increment: 1 } : undefined,
      },
    });

    return {
      success: true,
      positionId: updatedPosition.id,
      orderId: order.id,
      message: `SHORT position closed for ${signal.symbol} at ${currentPrice}. P&L: ${pnl.toFixed(2)} (${pnlPercent.toFixed(2)}%)`,
    };

  } catch (error) {
    console.error("Error executing EXIT_SHORT:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
