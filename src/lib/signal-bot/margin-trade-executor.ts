import db from "@/db";
import type { Bot, Signal } from "@prisma/client";
import { getMarginAccount, getMaxBorrowable, placeMarginOrder } from "@/lib/margin/binance-margin";
import { configurationRestAPI } from "@/types/binance";
import type { TradeExecutionResult } from "./trade-executor";
import { SideEffectType } from "@/types/margin";

/**
 * Margin trade execution context
 */
interface MarginTradeExecutionContext {
  bot: Bot & {
    exchange: {
      id: string;
      apiKey: string;
      apiSecret: string;
      totalValue: number | null;
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
 * Extract base and quote assets from symbol
 */
function extractAssets(symbol: string): { baseAsset: string; quoteAsset: string } {
  // Common quote assets
  const quoteAssets = ['USDT', 'BUSD', 'USDC', 'BTC', 'ETH', 'BNB'];
  
  for (const quote of quoteAssets) {
    if (symbol.endsWith(quote)) {
      const baseAsset = symbol.slice(0, -quote.length);
      return { baseAsset, quoteAsset: quote };
    }
  }
  
  // Default fallback
  return { baseAsset: symbol.slice(0, -4), quoteAsset: symbol.slice(-4) };
}

/**
 * Get available balance for an asset in margin account
 */
async function getMarginBalance(
  config: configurationRestAPI,
  asset: string
): Promise<{ available: number; borrowed: number; total: number }> {
  const marginAccount = await getMarginAccount(config);
  const assetInfo = marginAccount.userAssets?.find((a: any) => a.asset === asset);
  
  if (!assetInfo) {
    return { available: 0, borrowed: 0, total: 0 };
  }
  
  return {
    available: parseFloat(assetInfo.free || "0"),
    borrowed: parseFloat(assetInfo.borrowed || "0"),
    total: parseFloat(assetInfo.netAsset || "0"),
  };
}

/**
 * Determine appropriate side effect type based on bot config and order requirements
 */
function determineSideEffectType(
  bot: Bot,
  action: 'BUY' | 'SELL'
): 'NO_SIDE_EFFECT' | 'MARGIN_BUY' | 'AUTO_REPAY' | 'AUTO_BORROW_REPAY' {
  // If autoRepay is enabled, use appropriate side effect based on action
  if (bot.autoRepay) {
    return action === 'SELL' ? 'AUTO_REPAY' : 'MARGIN_BUY';
  }
  
  // Otherwise, use the bot's configured side effect type
  return bot.sideEffectType as 'NO_SIDE_EFFECT' | 'MARGIN_BUY' | 'AUTO_REPAY' | 'AUTO_BORROW_REPAY';
}

/**
 * Validate margin order against max borrowable limits
 */
async function validateMarginOrder(
  config: configurationRestAPI,
  requiredAsset: string,
  requiredAmount: number
): Promise<{ valid: boolean; error?: string; maxBorrowable?: number }> {
  try {
    // Get current balance
    const balance = await getMarginBalance(config, requiredAsset);
    
    // If we have enough balance, no need to check borrowable
    if (balance.available >= requiredAmount) {
      return { valid: true };
    }
    
    // Check max borrowable
    const maxBorrowableData = await getMaxBorrowable(config, requiredAsset);
    const maxBorrowable = parseFloat(maxBorrowableData.amount || '0');
    
    const amountNeededToBorrow = requiredAmount - balance.available;
    
    if (amountNeededToBorrow > maxBorrowable) {
      return {
        valid: false,
        error: `Insufficient borrowable amount. Need ${amountNeededToBorrow.toFixed(8)} ${requiredAsset}, but max borrowable is ${maxBorrowable.toFixed(8)}`,
        maxBorrowable,
      };
    }
    
    return { valid: true, maxBorrowable };
  } catch (error) {
    console.error('Error validating margin order:', error);
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Failed to validate margin order',
    };
  }
}

/**
 * Execute ENTER_LONG action for margin trading
 * Opens a long position by buying the base asset (with potential borrowing)
 */
export async function executeMarginEnterLong(
  context: MarginTradeExecutionContext
): Promise<TradeExecutionResult> {
  const { bot, signal, currentPrice } = context;

  try {
    console.log(`Executing MARGIN ENTER_LONG for ${signal.symbol}`);

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

    // Extract assets
    const { baseAsset, quoteAsset } = extractAssets(signal.symbol);

    // Calculate position size based on portfolio percentage
    const portfolioValue = bot.exchange.totalValue || 0;
    
    if (portfolioValue <= 0) {
      throw new Error("Invalid portfolio value. Please sync your exchange.");
    }

    const positionValue = (portfolioValue * bot.positionPercent) / 100;
    const adjustedQuantity = positionValue / currentPrice;

    // Apply leverage if configured
    const leveragedQuantity = adjustedQuantity * (bot.leverage || 1);

    // Configuration for API calls
    const config: configurationRestAPI = {
      apiKey: bot.exchange.apiKey,
      apiSecret: bot.exchange.apiSecret,
    };

    // For BUY orders, we need USDT (or quote asset)
    const requiredAmount = leveragedQuantity * currentPrice;
    
    // Validate order against max borrowable
    const validation = await validateMarginOrder(config, quoteAsset, requiredAmount);
    if (!validation.valid) {
      throw new Error(validation.error || 'Order validation failed');
    }

    // Determine side effect type based on bot configuration
    const sideEffectType = determineSideEffectType(bot, 'BUY');

    console.log(`Margin order details: quantity=${leveragedQuantity}, price=${currentPrice}, sideEffect=${sideEffectType}`);

    // Calculate stop loss and take profit
    const stopLoss = bot.stopLoss 
      ? currentPrice * (1 - bot.stopLoss / 100) 
      : null;
    
    const takeProfit = bot.takeProfit 
      ? currentPrice * (1 + bot.takeProfit / 100) 
      : null;

    // Create position in database
    const position = await db.position.create({
      data: {
        portfolioId: bot.portfolio.id,
        botId: bot.id,
        symbol: signal.symbol,
        side: "LONG",
        type: "MARKET",
        status: "OPEN",
        accountType: "MARGIN",
        marginType: "CROSS",
        entryPrice: currentPrice,
        currentPrice: currentPrice,
        quantity: leveragedQuantity,
        entryValue: leveragedQuantity * currentPrice,
        borrowedAmount: 0, // Will be updated after order execution
        borrowedAsset: quoteAsset,
        leverage: bot.leverage || 1,
        sideEffectType: sideEffectType,
        stopLoss,
        takeProfit,
        source: "BOT",
      },
    });

    // Create order in database
    const order = await db.order.create({
      data: {
        positionId: position.id,
        portfolioId: bot.portfolio.id,
        orderId: `BOT-MARGIN-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        type: "ENTRY",
        side: "BUY",
        orderType: "MARKET",
        accountType: "MARGIN",
        marginType: "CROSS",
        symbol: signal.symbol,
        quantity: leveragedQuantity,
        price: currentPrice,
        value: leveragedQuantity * currentPrice,
        sideEffectType: sideEffectType,
        status: "PENDING",
      },
    });

    // Place margin order on exchange
    const marginOrderResult = await placeMarginOrder(config, {
      symbol: signal.symbol,
      side: 'BUY',
      type: 'MARKET',
      quantity: leveragedQuantity.toString(),
      sideEffectType: sideEffectType as SideEffectType,
    });

    console.log('Margin order result:', marginOrderResult);

    // Update order status
    await db.order.update({
      where: { id: order.id },
      data: {
        status: "FILLED",
        fillPercent: 100,
      },
    });

    return {
      success: true,
      positionId: position.id,
      orderId: order.id,
      message: `Margin LONG position opened for ${signal.symbol} with ${sideEffectType}`,
    };
  } catch (error) {
    console.error("Error executing margin enter long:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to execute margin enter long",
    };
  }
}

/**
 * Execute EXIT_LONG action for margin trading
 * Closes a long position by selling the base asset (with potential auto-repay)
 */
export async function executeMarginExitLong(
  context: MarginTradeExecutionContext
): Promise<TradeExecutionResult> {
  const { bot, signal, currentPrice } = context;

  try {
    console.log(`Executing MARGIN EXIT_LONG for ${signal.symbol}`);

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

    // Extract assets
    const { baseAsset, quoteAsset } = extractAssets(signal.symbol);

    // Configuration for API calls
    const config: configurationRestAPI = {
      apiKey: bot.exchange.apiKey,
      apiSecret: bot.exchange.apiSecret,
    };

    // Determine side effect type based on bot configuration
    const sideEffectType = determineSideEffectType(bot, 'SELL');

    console.log(`Closing margin position: quantity=${position.quantity}, sideEffect=${sideEffectType}`);

    // Create exit order
    const exitOrder = await db.order.create({
      data: {
        positionId: position.id,
        portfolioId: bot.portfolio.id,
        orderId: `BOT-MARGIN-EXIT-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        type: "EXIT",
        side: "SELL",
        orderType: "MARKET",
        accountType: "MARGIN",
        marginType: "CROSS",
        symbol: signal.symbol,
        quantity: position.quantity,
        price: currentPrice,
        value: position.quantity * currentPrice,
        sideEffectType: sideEffectType,
        status: "PENDING",
      },
    });

    // Place margin sell order on exchange
    const marginOrderResult = await placeMarginOrder(config, {
      symbol: signal.symbol,
      side: 'SELL',
      type: 'MARKET',
      quantity: position.quantity.toString(),
      sideEffectType: sideEffectType as SideEffectType,
    });

    console.log('Margin exit order result:', marginOrderResult);

    // Calculate PnL
    const exitValue = position.quantity * currentPrice;
    const pnl = exitValue - position.entryValue;
    const pnlPercent = (pnl / position.entryValue) * 100;

    // Update position
    await db.position.update({
      where: { id: position.id },
      data: {
        status: "CLOSED",
        exitPrice: currentPrice,
        exitValue,
        pnl,
        pnlPercent,
        currentPrice: currentPrice,
      },
    });

    // Update order
    await db.order.update({
      where: { id: exitOrder.id },
      data: {
        status: "FILLED",
        fillPercent: 100,
        pnl: pnl,
      },
    });

    // Update bot stats
    await db.bot.update({
      where: { id: bot.id },
      data: {
        totalTrades: { increment: 1 },
        winTrades: pnl > 0 ? { increment: 1 } : undefined,
        totalPnl: { increment: pnl },
      },
    });

    return {
      success: true,
      positionId: position.id,
      orderId: exitOrder.id,
      message: `Margin LONG position closed for ${signal.symbol} with PnL: ${pnl.toFixed(2)} (${pnlPercent.toFixed(2)}%)`,
    };
  } catch (error) {
    console.error("Error executing margin exit long:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to execute margin exit long",
    };
  }
}

/**
 * Execute ENTER_SHORT action for margin trading
 * Opens a short position by borrowing and selling the base asset
 */
export async function executeMarginEnterShort(
  context: MarginTradeExecutionContext
): Promise<TradeExecutionResult> {
  const { bot, signal, currentPrice } = context;

  try {
    console.log(`Executing MARGIN ENTER_SHORT for ${signal.symbol}`);

    // Check if there's already an open SHORT position
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

    // Extract assets
    const { baseAsset, quoteAsset } = extractAssets(signal.symbol);

    // Calculate position size
    const portfolioValue = bot.exchange.totalValue || 0;
    
    if (portfolioValue <= 0) {
      throw new Error("Invalid portfolio value. Please sync your exchange.");
    }

    const positionValue = (portfolioValue * bot.positionPercent) / 100;
    const baseQuantity = positionValue / currentPrice;
    const leveragedQuantity = baseQuantity * (bot.leverage || 1);

    // Configuration for API calls
    const config: configurationRestAPI = {
      apiKey: bot.exchange.apiKey,
      apiSecret: bot.exchange.apiSecret,
    };

    // For SHORT (SELL), we need to borrow the base asset
    // Validate we can borrow enough
    const validation = await validateMarginOrder(config, baseAsset, leveragedQuantity);
    if (!validation.valid) {
      throw new Error(validation.error || 'Order validation failed');
    }

    // For short selling, we typically use MARGIN_BUY side effect to borrow
    const sideEffectType = 'MARGIN_BUY'; // This will borrow the asset if needed

    console.log(`Margin short order details: quantity=${leveragedQuantity}, price=${currentPrice}, sideEffect=${sideEffectType}`);

    // Calculate stop loss and take profit (inverted for shorts)
    const stopLoss = bot.stopLoss 
      ? currentPrice * (1 + bot.stopLoss / 100) 
      : null;
    
    const takeProfit = bot.takeProfit 
      ? currentPrice * (1 - bot.takeProfit / 100) 
      : null;

    // Create position in database
    const position = await db.position.create({
      data: {
        portfolioId: bot.portfolio.id,
        botId: bot.id,
        symbol: signal.symbol,
        side: "SHORT",
        type: "MARKET",
        status: "OPEN",
        accountType: "MARGIN",
        marginType: "CROSS",
        entryPrice: currentPrice,
        currentPrice: currentPrice,
        quantity: leveragedQuantity,
        entryValue: leveragedQuantity * currentPrice,
        borrowedAmount: 0, // Will be updated after order execution
        borrowedAsset: baseAsset,
        leverage: bot.leverage || 1,
        sideEffectType: sideEffectType,
        stopLoss,
        takeProfit,
        source: "BOT",
      },
    });

    // Create order in database
    const order = await db.order.create({
      data: {
        positionId: position.id,
        portfolioId: bot.portfolio.id,
        orderId: `BOT-MARGIN-SHORT-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        type: "ENTRY",
        side: "SELL",
        orderType: "MARKET",
        accountType: "MARGIN",
        marginType: "CROSS",
        symbol: signal.symbol,
        quantity: leveragedQuantity,
        price: currentPrice,
        value: leveragedQuantity * currentPrice,
        sideEffectType: sideEffectType,
        status: "PENDING",
      },
    });

    // Place margin short order (SELL with MARGIN_BUY to borrow)
    const marginOrderResult = await placeMarginOrder(config, {
      symbol: signal.symbol,
      side: 'SELL',
      type: 'MARKET',
      quantity: leveragedQuantity.toString(),
      sideEffectType: sideEffectType as SideEffectType,
    });

    console.log('Margin short order result:', marginOrderResult);

    // Update order status
    await db.order.update({
      where: { id: order.id },
      data: {
        status: "FILLED",
        fillPercent: 100,
      },
    });

    return {
      success: true,
      positionId: position.id,
      orderId: order.id,
      message: `Margin SHORT position opened for ${signal.symbol} with ${sideEffectType}`,
    };
  } catch (error) {
    console.error("Error executing margin enter short:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to execute margin enter short",
    };
  }
}

/**
 * Execute EXIT_SHORT action for margin trading
 * Closes a short position by buying back the base asset (to repay borrowed amount)
 */
export async function executeMarginExitShort(
  context: MarginTradeExecutionContext
): Promise<TradeExecutionResult> {
  const { bot, signal, currentPrice } = context;

  try {
    console.log(`Executing MARGIN EXIT_SHORT for ${signal.symbol}`);

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

    // Extract assets
    const { baseAsset, quoteAsset } = extractAssets(signal.symbol);

    // Configuration for API calls
    const config: configurationRestAPI = {
      apiKey: bot.exchange.apiKey,
      apiSecret: bot.exchange.apiSecret,
    };

    // For covering short, use AUTO_REPAY to automatically repay borrowed asset
    const sideEffectType = 'AUTO_REPAY';

    console.log(`Covering margin short: quantity=${position.quantity}, sideEffect=${sideEffectType}`);

    // Create exit order
    const exitOrder = await db.order.create({
      data: {
        positionId: position.id,
        portfolioId: bot.portfolio.id,
        orderId: `BOT-MARGIN-COVER-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        type: "EXIT",
        side: "BUY",
        orderType: "MARKET",
        accountType: "MARGIN",
        marginType: "CROSS",
        symbol: signal.symbol,
        quantity: position.quantity,
        price: currentPrice,
        value: position.quantity * currentPrice,
        sideEffectType: sideEffectType,
        status: "PENDING",
      },
    });

    // Place margin buy order to cover short (with AUTO_REPAY)
    const marginOrderResult = await placeMarginOrder(config, {
      symbol: signal.symbol,
      side: 'BUY',
      type: 'MARKET',
      quantity: position.quantity.toString(),
      sideEffectType: sideEffectType as SideEffectType,
    });

    console.log('Margin cover short result:', marginOrderResult);

    // Calculate PnL (for shorts, profit when exit price < entry price)
    const exitValue = position.quantity * currentPrice;
    const pnl = position.entryValue - exitValue; // Inverted for shorts
    const pnlPercent = (pnl / position.entryValue) * 100;

    // Update position
    await db.position.update({
      where: { id: position.id },
      data: {
        status: "CLOSED",
        exitPrice: currentPrice,
        exitValue,
        pnl,
        pnlPercent,
        currentPrice: currentPrice,
      },
    });

    // Update order
    await db.order.update({
      where: { id: exitOrder.id },
      data: {
        status: "FILLED",
        fillPercent: 100,
        pnl: pnl,
      },
    });

    // Update bot stats
    await db.bot.update({
      where: { id: bot.id },
      data: {
        totalTrades: { increment: 1 },
        winTrades: pnl > 0 ? { increment: 1 } : undefined,
        lossTrades: pnl <= 0 ? { increment: 1 } : undefined,
        totalPnl: { increment: pnl },
      },
    });

    return {
      success: true,
      positionId: position.id,
      orderId: exitOrder.id,
      message: `Margin SHORT position closed for ${signal.symbol} with PnL: ${pnl.toFixed(2)} (${pnlPercent.toFixed(2)}%)`,
    };
  } catch (error) {
    console.error("Error executing margin exit short:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to execute margin exit short",
    };
  }
}
