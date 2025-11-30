/**
 * Fast Trade Executor
 * 
 * SPEED-OPTIMIZED execution flow:
 * 1. Validate order constraints (LOT_SIZE, MIN_NOTIONAL)
 * 2. Execute on Binance FIRST (critical for price)
 * 3. Create DB records AFTER exchange success
 * 4. Update stats ASYNC (non-blocking)
 * 
 * This ensures fastest possible order execution with proper validation.
 */

import db from "@/db";
import type { Bot, Signal } from "@prisma/client";
import { placeSpotOrder, placeSpotCloseOrder } from "@/lib/services/exchange/binance-spot";
import { placeMarginOrder, placeMarginCloseOrder } from "@/lib/services/exchange/binance-margin";
import type { BinanceConfig, SpotOrderParams, MarginOrderParams } from "@/lib/services/exchange/types";
import { SideEffectType } from "@/types/margin";
import { 
  getSymbolConstraints, 
  validateAndFormatOrderQuantity,
  formatQuantityToLotSize,
  validateBalance,
  type TradingConstraints 
} from "./exchange-info-utils";

export interface FastExecutionContext {
  bot: Bot & {
    exchange: {
      id: string;
      apiKey: string;
      apiSecret: string;
      spotValue: number | null;
      marginValue: number | null;
      totalValue: number | null;
      isActive: boolean;
    };
    portfolio: {
      id: string;
      userId: string;
    };
  };
  signal: Signal;
  currentPrice: number;
}

export interface FastExecutionResult {
  success: boolean;
  positionId?: string;
  orderId?: string;
  binanceOrderId?: string;
  message?: string;
  error?: string;
  skipped?: boolean;
  skipReason?: string;
  executionTime?: number;
}

/**
 * Extract base and quote assets from symbol
 */
function extractAssets(symbol: string): { baseAsset: string; quoteAsset: string } {
  const quoteAssets = ['USDT', 'BUSD', 'USDC', 'BTC', 'ETH', 'BNB'];
  for (const quote of quoteAssets) {
    if (symbol.endsWith(quote)) {
      return { baseAsset: symbol.slice(0, -quote.length), quoteAsset: quote };
    }
  }
  return { baseAsset: symbol.slice(0, -4), quoteAsset: symbol.slice(-4) };
}

/**
 * Get Binance config from bot exchange
 */
function getBinanceConfig(bot: FastExecutionContext['bot']): BinanceConfig {
  return {
    apiKey: bot.exchange.apiKey,
    apiSecret: bot.exchange.apiSecret,
  };
}

/**
 * Calculate position size based on bot settings
 * Uses fixed trade amount (tradeAmount) instead of percentage
 */
function calculatePositionSize(
  bot: FastExecutionContext['bot'],
  currentPrice: number
): { quantity: number; value: number; leverage: number } {
  const leverage = bot.accountType === 'MARGIN' ? (bot.leverage || 1) : 1;
  
  // Use fixed trade amount - convert if in BASE currency
  let basePositionValue: number;
  
  if (bot.tradeAmountType === 'BASE') {
    // tradeAmount is in base currency (e.g., BTC), convert to quote value
    basePositionValue = (bot.tradeAmount || 0) * currentPrice;
  } else {
    // tradeAmount is in quote currency (e.g., USDT), use directly
    basePositionValue = bot.tradeAmount || 0;
  }
  
  const leveragedValue = basePositionValue * leverage;
  const quantity = leveragedValue / currentPrice;

  return { quantity, value: leveragedValue, leverage };
}

/**
 * Update stats in background (non-blocking)
 * @param botId - Bot ID
 * @param userId - User ID for portfolio recalculation
 * @param pnl - P&L value (only for EXIT trades)
 * @param isExit - True if this is an EXIT trade (counts towards totalTrades)
 * 
 * NOTE: totalTrades is only incremented on EXIT (one round-trip = one trade)
 * This prevents double-counting when ENTER and EXIT both call this function
 */
async function updateStatsAsync(
  botId: string,
  userId: string,
  pnl?: number,
  isExit: boolean = false
): Promise<void> {
  // Run in background, don't wait
  setImmediate(async () => {
    try {
      // Update bot stats - only increment totalTrades on EXIT
      const updateData: any = {};
      
      if (isExit) {
        updateData.totalTrades = { increment: 1 };
        
        if (pnl !== undefined) {
          updateData.totalPnl = { increment: pnl };
          if (pnl > 0) {
            updateData.winTrades = { increment: 1 };
          } else {
            updateData.lossTrades = { increment: 1 };
          }
        }
      }

      // Only update if there's something to update
      if (Object.keys(updateData).length > 0) {
        await db.bot.update({
          where: { id: botId },
          data: updateData,
        });
      }

      // Recalculate portfolio stats
      const { recalculatePortfolioStatsInternal } = await import("@/db/actions/portfolio/recalculate-stats");
      await recalculatePortfolioStatsInternal(userId);
    } catch (error) {
      console.error("[Fast Executor] Async stats update failed:", error);
    }
  });
}

/**
 * FAST ENTER_LONG - Binance first, DB second
 * Uses atomic position creation to prevent race conditions
 */
export async function fastEnterLong(
  context: FastExecutionContext
): Promise<FastExecutionResult> {
  const startTime = Date.now();
  const { bot, signal, currentPrice } = context;

  try {
    console.log(`[Fast] ENTER_LONG ${signal.symbol}`);

    // Atomic check for existing position using transaction
    // This prevents race conditions when multiple signals arrive simultaneously
    const existingPosition = await db.$transaction(async (tx) => {
      return tx.position.findFirst({
        where: {
          portfolioId: bot.portfolioId,
          botId: bot.id,
          symbol: signal.symbol,
          side: "LONG",
          status: "OPEN",
        },
        select: { id: true },
      });
    }, {
      isolationLevel: 'Serializable',
    });

    if (existingPosition) {
      return {
        success: false,
        skipped: true,
        skipReason: `Already have open LONG for ${signal.symbol}`,
        executionTime: Date.now() - startTime,
      };
    }

    // Calculate position size
    const { quantity: rawQuantity, value, leverage } = calculatePositionSize(bot, currentPrice);
    const config = getBinanceConfig(bot);
    const { baseAsset, quoteAsset } = extractAssets(signal.symbol);

    // STEP 0: VALIDATE ORDER CONSTRAINTS (LOT_SIZE, MIN_NOTIONAL)
    const constraints = await getSymbolConstraints(config, signal.symbol);
    
    if (!constraints) {
      console.warn(`[Fast] Could not fetch constraints for ${signal.symbol}, proceeding with raw quantity`);
    }

    let quantity = rawQuantity;
    if (constraints) {
      const validation = validateAndFormatOrderQuantity(rawQuantity, currentPrice, constraints);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error || "Order validation failed",
          executionTime: Date.now() - startTime,
        };
      }
      quantity = validation.formattedQuantity;
      console.log(`[Fast] Quantity validated: ${rawQuantity.toFixed(8)} → ${quantity.toFixed(8)}`);
    }

    console.log(`[Fast] Placing order: ${quantity.toFixed(8)} @ market (value: ${value.toFixed(2)} ${quoteAsset})`);

    // STEP 0.5: VALIDATE BALANCE (for SPOT accounts only - margin handles its own balance)
    if (bot.accountType !== 'MARGIN') {
      const balanceCheck = await validateBalance(config, quoteAsset, value);
      if (!balanceCheck.valid) {
        return {
          success: false,
          error: balanceCheck.error || "Insufficient balance",
          executionTime: Date.now() - startTime,
        };
      }
      console.log(`[Fast] Balance validated: ${balanceCheck.available.toFixed(2)} ${quoteAsset} available`);
    }

    // STEP 1: EXECUTE ON BINANCE FIRST (SPEED CRITICAL)
    let binanceResult;
    const binanceStartTime = Date.now();

    if (bot.accountType === 'MARGIN') {
      const sideEffectType = bot.sideEffectType as SideEffectType || 'NO_SIDE_EFFECT';
      const marginParams: MarginOrderParams = {
        symbol: signal.symbol,
        side: 'BUY',
        type: 'MARKET',
        quoteOrderQty: value.toFixed(2), // Use quote amount for market buy
        sideEffectType,
      };
      binanceResult = await placeMarginOrder(config, marginParams);
    } else {
      const spotParams: SpotOrderParams = {
        symbol: signal.symbol,
        side: 'BUY',
        type: 'MARKET',
        quoteOrderQty: value.toFixed(2),
      };
      binanceResult = await placeSpotOrder(config, spotParams);
    }

    const binanceTime = Date.now() - binanceStartTime;
    console.log(`[Fast] Binance executed in ${binanceTime}ms`);

    if (!binanceResult.success || !binanceResult.data) {
      return {
        success: false,
        error: binanceResult.error || "Binance order failed",
        executionTime: Date.now() - startTime,
      };
    }

    const binanceData = binanceResult.data;
    let executedQty = parseFloat(binanceData.executedQty || String(quantity));
    const executedPrice = parseFloat(binanceData.cummulativeQuoteQty || String(value)) / executedQty;

    // Deduct commission if paid in base asset
    // Binance deducts commission from the purchased asset (e.g., buying BTC, commission in BTC)
    if (binanceData.fills && binanceData.fills.length > 0) {
      const { baseAsset: commissionCheckAsset } = extractAssets(signal.symbol);
      let totalCommission = 0;
      
      for (const fill of binanceData.fills) {
        const commission = parseFloat(fill.commission || '0');
        const commissionAsset = fill.commissionAsset;
        
        if (commissionAsset === commissionCheckAsset && commission > 0) {
          totalCommission += commission;
        }
      }
      
      if (totalCommission > 0) {
        executedQty -= totalCommission;
        console.log(`[Fast] Commission deducted: ${totalCommission} ${commissionCheckAsset}, Net quantity: ${executedQty}`);
      }
    }

    // STEP 2: CREATE DB RECORDS (after success) - Use transaction to prevent duplicates
    const stopLoss = bot.stopLoss ? executedPrice * (1 - bot.stopLoss / 100) : null;
    const takeProfit = bot.takeProfit ? executedPrice * (1 + bot.takeProfit / 100) : null;

    // Use transaction with conflict check to prevent duplicate positions
    const { position, order } = await db.$transaction(async (tx) => {
      // Double-check no position was created by another request
      const existingCheck = await tx.position.findFirst({
        where: {
          portfolioId: bot.portfolioId,
          botId: bot.id,
          symbol: signal.symbol,
          side: "LONG",
          status: "OPEN",
        },
        select: { id: true },
      });

      if (existingCheck) {
        throw new Error(`POSITION_ALREADY_EXISTS:${existingCheck.id}`);
      }

      const newPosition = await tx.position.create({
        data: {
          portfolioId: bot.portfolioId,
          botId: bot.id,
          symbol: signal.symbol,
          side: "LONG",
          type: "MARKET",
          entryPrice: executedPrice,
          quantity: executedQty,
          entryValue: executedQty * executedPrice, // Use actual executed value
          currentPrice: executedPrice,
          stopLoss,
          takeProfit,
          leverage,
          accountType: bot.accountType === 'MARGIN' ? 'MARGIN' : 'SPOT',
          source: "BOT",
          status: "OPEN",
        },
      });

      const newOrder = await tx.order.create({
        data: {
          positionId: newPosition.id,
          portfolioId: bot.portfolioId,
          orderId: String(binanceData.orderId),
          symbol: signal.symbol,
          type: "ENTRY",
          side: "BUY",
          orderType: "MARKET",
          price: executedPrice,
          quantity: executedQty,
          value: executedQty * executedPrice,
          status: "FILLED",
          fillPercent: 100,
          pnl: 0,
        },
      });

      return { position: newPosition, order: newOrder };
    });

    // STEP 3: UPDATE STATS ASYNC (non-blocking)
    updateStatsAsync(bot.id, bot.portfolio.userId);

    const totalTime = Date.now() - startTime;
    console.log(`[Fast] ENTER_LONG complete in ${totalTime}ms (Binance: ${binanceTime}ms)`);

    return {
      success: true,
      positionId: position.id,
      orderId: order.id,
      binanceOrderId: String(binanceData.orderId),
      message: `LONG opened ${signal.symbol} @ ${executedPrice.toFixed(2)}`,
      executionTime: totalTime,
    };

  } catch (error) {
    console.error("[Fast] ENTER_LONG error:", error);
    
    // Handle race condition where position was created by another request
    if (error instanceof Error && error.message.startsWith('POSITION_ALREADY_EXISTS:')) {
      const existingId = error.message.split(':')[1];
      return {
        success: false,
        skipped: true,
        skipReason: `Position already created by another request: ${existingId}`,
        executionTime: Date.now() - startTime,
      };
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      executionTime: Date.now() - startTime,
    };
  }
}

/**
 * FAST EXIT_LONG - Binance first, DB second
 */
export async function fastExitLong(
  context: FastExecutionContext
): Promise<FastExecutionResult> {
  const startTime = Date.now();
  const { bot, signal, currentPrice } = context;

  try {
    console.log(`[Fast] EXIT_LONG ${signal.symbol}`);

    // Atomically find and lock the position using transaction
    // This prevents race conditions with position monitor or duplicate EXIT signals
    const position = await db.$transaction(async (tx) => {
      const pos = await tx.position.findFirst({
        where: {
          portfolioId: bot.portfolioId,
          botId: bot.id,
          symbol: signal.symbol,
          side: "LONG",
          status: "OPEN",
        },
      });

      if (!pos) {
        return null;
      }

      // Verify it's still OPEN (double-check pattern)
      const verify = await tx.position.findFirst({
        where: {
          id: pos.id,
          status: "OPEN",
        },
      });

      return verify;
    }, {
      isolationLevel: 'Serializable',
    });

    if (!position) {
      return {
        success: false,
        skipped: true,
        skipReason: `No open LONG for ${signal.symbol} (may already be closing)`,
        executionTime: Date.now() - startTime,
      };
    }

    const config = getBinanceConfig(bot);

    // Format close quantity to match LOT_SIZE requirements
    let closeQuantity = position.quantity;
    const constraints = await getSymbolConstraints(config, signal.symbol);
    if (constraints) {
      closeQuantity = formatQuantityToLotSize(position.quantity, {
        minQty: constraints.minQty,
        maxQty: constraints.maxQty,
        stepSize: constraints.stepSize,
      });
      console.log(`[Fast] Close quantity formatted: ${position.quantity} → ${closeQuantity}`);
    }

    // STEP 1: EXECUTE ON BINANCE FIRST
    let binanceResult;
    const binanceStartTime = Date.now();

    if (bot.accountType === 'MARGIN') {
      const sideEffectType = bot.autoRepay ? 'AUTO_REPAY' : 'NO_SIDE_EFFECT';
      binanceResult = await placeMarginCloseOrder(
        config,
        signal.symbol,
        "LONG",
        closeQuantity,
        sideEffectType as any
      );
    } else {
      binanceResult = await placeSpotCloseOrder(
        config,
        signal.symbol,
        "LONG",
        closeQuantity
      );
    }

    const binanceTime = Date.now() - binanceStartTime;

    if (!binanceResult.success || !binanceResult.data) {
      // Position remains OPEN on failure (no status change needed)
      return {
        success: false,
        error: binanceResult.error || "Binance close order failed",
        executionTime: Date.now() - startTime,
      };
    }

    const binanceData = binanceResult.data;
    const executedQty = parseFloat(binanceData.executedQty || String(closeQuantity));
    const executedPrice = parseFloat(binanceData.cummulativeQuoteQty || String(closeQuantity * currentPrice)) / executedQty;

    // Calculate P&L
    const exitValue = executedQty * executedPrice;
    const pnl = exitValue - position.entryValue;
    const pnlPercent = (pnl / position.entryValue) * 100;

    // STEP 2: UPDATE DB
    const updatedPosition = await db.position.update({
      where: { id: position.id },
      data: {
        exitPrice: executedPrice,
        exitValue,
        pnl,
        pnlPercent,
        status: "CLOSED",
        currentPrice: executedPrice,
      },
    });

    const order = await db.order.create({
      data: {
        positionId: position.id,
        portfolioId: bot.portfolioId,
        orderId: String(binanceData.orderId),
        symbol: signal.symbol,
        type: "EXIT",
        side: "SELL",
        orderType: "MARKET",
        price: executedPrice,
        quantity: executedQty,
        value: exitValue,
        status: "FILLED",
        fillPercent: 100,
        pnl,
      },
    });

    // STEP 3: UPDATE STATS ASYNC (isExit=true for trade counting)
    updateStatsAsync(bot.id, bot.portfolio.userId, pnl, true);

    const totalTime = Date.now() - startTime;
    console.log(`[Fast] EXIT_LONG complete in ${totalTime}ms (P&L: ${pnl.toFixed(2)})`);

    return {
      success: true,
      positionId: updatedPosition.id,
      orderId: order.id,
      binanceOrderId: String(binanceData.orderId),
      message: `LONG closed ${signal.symbol} @ ${executedPrice.toFixed(2)}, P&L: ${pnl.toFixed(2)} (${pnlPercent.toFixed(2)}%)`,
      executionTime: totalTime,
    };

  } catch (error) {
    console.error("[Fast] EXIT_LONG error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      executionTime: Date.now() - startTime,
    };
  }
}

/**
 * FAST ENTER_SHORT - Binance first, DB second (Margin only)
 */
export async function fastEnterShort(
  context: FastExecutionContext
): Promise<FastExecutionResult> {
  const startTime = Date.now();
  const { bot, signal, currentPrice } = context;

  // Short only works with margin
  if (bot.accountType !== 'MARGIN') {
    return {
      success: false,
      error: "SHORT requires MARGIN account",
      executionTime: Date.now() - startTime,
    };
  }

  try {
    console.log(`[Fast] ENTER_SHORT ${signal.symbol}`);

    // Atomic check for existing position using transaction
    const existingPosition = await db.$transaction(async (tx) => {
      return tx.position.findFirst({
        where: {
          portfolioId: bot.portfolioId,
          botId: bot.id,
          symbol: signal.symbol,
          side: "SHORT",
          status: "OPEN",
        },
        select: { id: true },
      });
    }, {
      isolationLevel: 'Serializable',
    });

    if (existingPosition) {
      return {
        success: false,
        skipped: true,
        skipReason: `Already have open SHORT for ${signal.symbol}`,
        executionTime: Date.now() - startTime,
      };
    }

    const { quantity: rawQuantity, value, leverage } = calculatePositionSize(bot, currentPrice);
    const config = getBinanceConfig(bot);
    const { baseAsset, quoteAsset } = extractAssets(signal.symbol);

    // STEP 0: VALIDATE ORDER CONSTRAINTS (LOT_SIZE, MIN_NOTIONAL)
    const constraints = await getSymbolConstraints(config, signal.symbol);
    
    if (!constraints) {
      console.warn(`[Fast] Could not fetch constraints for ${signal.symbol}, proceeding with raw quantity`);
    }

    let quantity = rawQuantity;
    if (constraints) {
      const validation = validateAndFormatOrderQuantity(rawQuantity, currentPrice, constraints);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error || "Order validation failed",
          executionTime: Date.now() - startTime,
        };
      }
      quantity = validation.formattedQuantity;
      console.log(`[Fast] SHORT Quantity validated: ${rawQuantity.toFixed(8)} → ${quantity.toFixed(8)}`);
    }

    console.log(`[Fast] Placing SHORT order: ${quantity.toFixed(8)} @ market (value: ${value.toFixed(2)} ${quoteAsset})`);

    // STEP 1: EXECUTE ON BINANCE FIRST - Short sell (borrow and sell base asset)
    const binanceStartTime = Date.now();
    const sideEffectType = 'MARGIN_BUY' as SideEffectType; // Auto-borrow for short

    const marginParams: MarginOrderParams = {
      symbol: signal.symbol,
      side: 'SELL',
      type: 'MARKET',
      quantity: quantity.toFixed(8),
      sideEffectType,
    };

    const binanceResult = await placeMarginOrder(config, marginParams);
    const binanceTime = Date.now() - binanceStartTime;

    if (!binanceResult.success || !binanceResult.data) {
      return {
        success: false,
        error: binanceResult.error || "Binance short order failed",
        executionTime: Date.now() - startTime,
      };
    }

    const binanceData = binanceResult.data;
    let executedQty = parseFloat(binanceData.executedQty || String(quantity));
    const executedPrice = parseFloat(binanceData.cummulativeQuoteQty || String(value)) / executedQty;

    // Deduct commission if paid in base asset
    // For shorts (SELL), commission is typically paid in quote asset, but check anyway
    if (binanceData.fills && binanceData.fills.length > 0) {
      let totalCommission = 0;
      
      for (const fill of binanceData.fills) {
        const commission = parseFloat(fill.commission || '0');
        const commissionAsset = fill.commissionAsset;
        
        if (commissionAsset === baseAsset && commission > 0) {
          totalCommission += commission;
        }
      }
      
      if (totalCommission > 0) {
        executedQty -= totalCommission;
        console.log(`[Fast] SHORT Commission deducted: ${totalCommission} ${baseAsset}, Net quantity: ${executedQty}`);
      }
    }

    // STEP 2: CREATE DB RECORDS - Use transaction to prevent duplicates
    const stopLoss = bot.stopLoss ? executedPrice * (1 + bot.stopLoss / 100) : null;
    const takeProfit = bot.takeProfit ? executedPrice * (1 - bot.takeProfit / 100) : null;

    // Use transaction with conflict check to prevent duplicate positions
    const { position, order } = await db.$transaction(async (tx) => {
      // Double-check no position was created by another request
      const existingCheck = await tx.position.findFirst({
        where: {
          portfolioId: bot.portfolioId,
          botId: bot.id,
          symbol: signal.symbol,
          side: "SHORT",
          status: "OPEN",
        },
        select: { id: true },
      });

      if (existingCheck) {
        throw new Error(`POSITION_ALREADY_EXISTS:${existingCheck.id}`);
      }

      const newPosition = await tx.position.create({
        data: {
          portfolioId: bot.portfolioId,
          botId: bot.id,
          symbol: signal.symbol,
          side: "SHORT",
          type: "MARKET",
          entryPrice: executedPrice,
          quantity: executedQty,
          entryValue: executedQty * executedPrice, // Use actual executed value
          currentPrice: executedPrice,
          stopLoss,
          takeProfit,
          leverage,
          accountType: "MARGIN",
          source: "BOT",
          status: "OPEN",
        },
      });

      const newOrder = await tx.order.create({
        data: {
          positionId: newPosition.id,
          portfolioId: bot.portfolioId,
          orderId: String(binanceData.orderId),
          symbol: signal.symbol,
          type: "ENTRY",
          side: "SELL",
          orderType: "MARKET",
          price: executedPrice,
          quantity: executedQty,
          value: executedQty * executedPrice,
          status: "FILLED",
          fillPercent: 100,
          pnl: 0,
        },
      });

      return { position: newPosition, order: newOrder };
    });

    // STEP 3: UPDATE STATS ASYNC
    updateStatsAsync(bot.id, bot.portfolio.userId);

    const totalTime = Date.now() - startTime;
    console.log(`[Fast] ENTER_SHORT complete in ${totalTime}ms`);

    return {
      success: true,
      positionId: position.id,
      orderId: order.id,
      binanceOrderId: String(binanceData.orderId),
      message: `SHORT opened ${signal.symbol} @ ${executedPrice.toFixed(2)}`,
      executionTime: totalTime,
    };

  } catch (error) {
    console.error("[Fast] ENTER_SHORT error:", error);
    
    // Handle race condition where position was created by another request
    if (error instanceof Error && error.message.startsWith('POSITION_ALREADY_EXISTS:')) {
      const existingId = error.message.split(':')[1];
      return {
        success: false,
        skipped: true,
        skipReason: `Position already created by another request: ${existingId}`,
        executionTime: Date.now() - startTime,
      };
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      executionTime: Date.now() - startTime,
    };
  }
}

/**
 * FAST EXIT_SHORT - Binance first, DB second
 */
export async function fastExitShort(
  context: FastExecutionContext
): Promise<FastExecutionResult> {
  const startTime = Date.now();
  const { bot, signal, currentPrice } = context;

  try {
    console.log(`[Fast] EXIT_SHORT ${signal.symbol}`);

    // Atomically find and lock the position using transaction
    const position = await db.$transaction(async (tx) => {
      const pos = await tx.position.findFirst({
        where: {
          portfolioId: bot.portfolioId,
          botId: bot.id,
          symbol: signal.symbol,
          side: "SHORT",
          status: "OPEN",
        },
      });

      if (!pos) {
        return null;
      }

      // Verify it's still OPEN (double-check pattern)
      const verify = await tx.position.findFirst({
        where: {
          id: pos.id,
          status: "OPEN",
        },
      });

      return verify;
    }, {
      isolationLevel: 'Serializable',
    });

    if (!position) {
      return {
        success: false,
        skipped: true,
        skipReason: `No open SHORT for ${signal.symbol} (may already be closing)`,
        executionTime: Date.now() - startTime,
      };
    }

    const config = getBinanceConfig(bot);

    // Format close quantity to match LOT_SIZE requirements
    let closeQuantity = position.quantity;
    const constraints = await getSymbolConstraints(config, signal.symbol);
    if (constraints) {
      closeQuantity = formatQuantityToLotSize(position.quantity, {
        minQty: constraints.minQty,
        maxQty: constraints.maxQty,
        stepSize: constraints.stepSize,
      });
      console.log(`[Fast] SHORT Close quantity formatted: ${position.quantity} → ${closeQuantity}`);
    }

    // STEP 1: EXECUTE ON BINANCE FIRST - Buy back to close short
    const binanceStartTime = Date.now();
    const sideEffectType = bot.autoRepay ? 'AUTO_REPAY' : 'NO_SIDE_EFFECT';

    const binanceResult = await placeMarginCloseOrder(
      config,
      signal.symbol,
      "SHORT",
      closeQuantity,
      sideEffectType as any
    );

    const binanceTime = Date.now() - binanceStartTime;

    if (!binanceResult.success || !binanceResult.data) {
      // Position remains OPEN on failure (no status change needed)
      return {
        success: false,
        error: binanceResult.error || "Binance close short failed",
        executionTime: Date.now() - startTime,
      };
    }

    const binanceData = binanceResult.data;
    const executedQty = parseFloat(binanceData.executedQty || String(closeQuantity));
    const executedPrice = parseFloat(binanceData.cummulativeQuoteQty || String(closeQuantity * currentPrice)) / executedQty;

    // Calculate P&L (inverse for short)
    const exitValue = executedQty * executedPrice;
    const pnl = position.entryValue - exitValue; // Profit when price goes down
    const pnlPercent = (pnl / position.entryValue) * 100;

    // STEP 2: UPDATE DB
    const updatedPosition = await db.position.update({
      where: { id: position.id },
      data: {
        exitPrice: executedPrice,
        exitValue,
        pnl,
        pnlPercent,
        status: "CLOSED",
        currentPrice: executedPrice,
      },
    });

    const order = await db.order.create({
      data: {
        positionId: position.id,
        portfolioId: bot.portfolioId,
        orderId: String(binanceData.orderId),
        symbol: signal.symbol,
        type: "EXIT",
        side: "BUY",
        orderType: "MARKET",
        price: executedPrice,
        quantity: executedQty,
        value: exitValue,
        status: "FILLED",
        fillPercent: 100,
        pnl,
      },
    });

    // STEP 3: UPDATE STATS ASYNC (isExit=true for trade counting)
    updateStatsAsync(bot.id, bot.portfolio.userId, pnl, true);

    const totalTime = Date.now() - startTime;
    console.log(`[Fast] EXIT_SHORT complete in ${totalTime}ms (P&L: ${pnl.toFixed(2)})`);

    return {
      success: true,
      positionId: updatedPosition.id,
      orderId: order.id,
      binanceOrderId: String(binanceData.orderId),
      message: `SHORT closed ${signal.symbol} @ ${executedPrice.toFixed(2)}, P&L: ${pnl.toFixed(2)} (${pnlPercent.toFixed(2)}%)`,
      executionTime: totalTime,
    };

  } catch (error) {
    console.error("[Fast] EXIT_SHORT error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      executionTime: Date.now() - startTime,
    };
  }
}

