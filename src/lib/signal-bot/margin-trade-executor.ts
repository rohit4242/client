import db from "@/db";
import type { Bot, Signal } from "@prisma/client";
import { getMarginAccount, getMaxBorrowable, placeMarginOrder } from "@/lib/margin/binance-margin";
import { configurationRestAPI } from "@/types/binance";
import type { TradeExecutionResult } from "./trade-executor";
import { SideEffectType } from "@/types/margin";
import { 
  getSymbolConstraints, 
  validateAndFormatOrderQuantity,
  formatQuantityToLotSize,
} from "./exchange-info-utils";

/**
 * Margin trade execution context
 */
interface MarginTradeExecutionContext {
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
 * Calculate optimal order size considering available balance, leverage, and borrow limits
 */
async function calculateOptimalOrderSize(
  config: configurationRestAPI,
  requiredAsset: string,
  desiredAmount: number,
  maxBorrowPercent: number,
  accountType: 'QUOTE' | 'BASE'
): Promise<{ 
  valid: boolean; 
  error?: string; 
  availableAmount: number;
  borrowAmount: number;
  totalAmount: number;
  maxBorrowable: number;
}> {
  try {
    // Get current balance
    const balance = await getMarginBalance(config, requiredAsset);
    console.log(`Current balance for ${requiredAsset}:`, {
      available: balance.available,
      borrowed: balance.borrowed,
      total: balance.total
    });
    
    // If we have enough balance, no need to borrow
    if (balance.available >= desiredAmount) {
      return { 
        valid: true, 
        availableAmount: balance.available,
        borrowAmount: 0,
        totalAmount: desiredAmount,
        maxBorrowable: 0
      };
    }
    
    // Calculate how much we need to borrow
    const amountNeededToBorrow = desiredAmount - balance.available;
    
    // Check max borrowable from exchange
    const maxBorrowableData = await getMaxBorrowable(config, requiredAsset);
    const maxBorrowable = parseFloat(maxBorrowableData.amount || '0');
    
    console.log(`Borrow calculation for ${requiredAsset}:`, {
      desired: desiredAmount,
      available: balance.available,
      needToBorrow: amountNeededToBorrow,
      maxBorrowable: maxBorrowable
    });
    
    // Check if we can borrow enough from exchange
    if (amountNeededToBorrow > maxBorrowable) {
      return {
        valid: false,
        error: `Insufficient borrowable amount. Need ${amountNeededToBorrow.toFixed(8)} ${requiredAsset}, but max borrowable is ${maxBorrowable.toFixed(8)}`,
        availableAmount: balance.available,
        borrowAmount: 0,
        totalAmount: balance.available,
        maxBorrowable: maxBorrowable
      };
    }
    
    // Check bot's maxBorrowPercent limit
    // The maxBorrowPercent is the percentage of the desired position that can be borrowed
    const maxAllowedBorrow = (desiredAmount * maxBorrowPercent) / 100;
    
    console.log(`Borrow limit check:`, {
      maxBorrowPercent: maxBorrowPercent,
      maxAllowedBorrow: maxAllowedBorrow,
      amountNeededToBorrow: amountNeededToBorrow
    });
    
    if (amountNeededToBorrow > maxAllowedBorrow) {
      return {
        valid: false,
        error: `Borrow amount ${amountNeededToBorrow.toFixed(8)} ${requiredAsset} exceeds bot's max borrow limit of ${maxBorrowPercent}% (${maxAllowedBorrow.toFixed(8)} ${requiredAsset})`,
        availableAmount: balance.available,
        borrowAmount: 0,
        totalAmount: balance.available,
        maxBorrowable: maxBorrowable
      };
    }
    
    return { 
      valid: true,
      availableAmount: balance.available,
      borrowAmount: amountNeededToBorrow,
      totalAmount: desiredAmount,
      maxBorrowable: maxBorrowable
    };
  } catch (error) {
    console.error('Error calculating optimal order size:', error);
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Failed to calculate order size',
      availableAmount: 0,
      borrowAmount: 0,
      totalAmount: 0,
      maxBorrowable: 0
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

    // Calculate position size using fixed trade amount
    // For MARGIN bots, use marginValue from the exchange for validation
    // Fallback to totalValue if marginValue is not available (migration not run or exchange not synced)
    const portfolioValue = bot.exchange.marginValue || bot.exchange.totalValue || 0;
    
    if (portfolioValue <= 0) {
      throw new Error("Invalid portfolio value. Please sync your exchange.");
    }

    // Use fixed trade amount - convert if in BASE currency
    let yourCapitalAllocation: number;
    if (bot.tradeAmountType === 'BASE') {
      // tradeAmount is in base currency (e.g., BTC), convert to quote value
      yourCapitalAllocation = (bot.tradeAmount || 0) * currentPrice;
    } else {
      // tradeAmount is in quote currency (e.g., USDT), use directly
      yourCapitalAllocation = bot.tradeAmount || 0;
    }
    
    // Apply leverage to get total position size
    const leverage = bot.leverage || 1;
    const totalPositionSize = yourCapitalAllocation * leverage;
    
    // Calculate how much needs to be borrowed
    // Formula: borrow = your capital × (leverage - 1)
    const amountToBorrow = yourCapitalAllocation * (leverage - 1);
    
    console.log(`Position calculation:`, {
      portfolioValue,
      tradeAmount: bot.tradeAmount,
      tradeAmountType: bot.tradeAmountType,
      yourCapitalAllocation,
      leverage,
      totalPositionSize,
      amountToBorrow
    });

    // Configuration for API calls
    const config: configurationRestAPI = {
      apiKey: bot.exchange.apiKey,
      apiSecret: bot.exchange.apiSecret,
    };

    // Check if you have enough of YOUR OWN capital
    const balance = await getMarginBalance(config, quoteAsset);
    
    if (balance.available < yourCapitalAllocation) {
      throw new Error(
        `Insufficient balance. Need ${yourCapitalAllocation.toFixed(2)} ${quoteAsset} but only have ${balance.available.toFixed(2)} available. ` +
        `Please add more funds or reduce position percentage.`
      );
    }

    // If leverage > 1, validate borrowing
    if (leverage > 1 && amountToBorrow > 0) {
      // Get exchange's max borrowable amount
      const maxBorrowableData = await getMaxBorrowable(config, quoteAsset);
      const exchangeMaxBorrowable = parseFloat(maxBorrowableData.amount || '0');
      
      // Calculate bot's max borrow limit (percentage of exchange's max)
      // If exchange allows 100 USDT and bot maxBorrowPercent is 50%, bot can only borrow 50 USDT
      const botMaxBorrowLimit = exchangeMaxBorrowable * (bot.maxBorrowPercent / 100);
      
      console.log(`Borrow limits:`, {
        exchangeMaxBorrowable: exchangeMaxBorrowable.toFixed(2) + ' ' + quoteAsset,
        botMaxBorrowPercent: bot.maxBorrowPercent + '%',
        botMaxBorrowLimit: botMaxBorrowLimit.toFixed(2) + ' ' + quoteAsset,
        amountNeeded: amountToBorrow.toFixed(2) + ' ' + quoteAsset
      });
      
      // Check if amount needed exceeds bot's allowed limit
      if (amountToBorrow > botMaxBorrowLimit) {
        throw new Error(
          `Cannot borrow ${amountToBorrow.toFixed(2)} ${quoteAsset}. ` +
          `Bot's max borrow limit is ${botMaxBorrowLimit.toFixed(2)} ${quoteAsset} ` +
          `(${bot.maxBorrowPercent}% of exchange's ${exchangeMaxBorrowable.toFixed(2)} ${quoteAsset} max). ` +
          `Increase maxBorrowPercent, reduce leverage, or reduce position size.`
        );
      }
      
      console.log(`✅ Borrow validation passed - borrowing ${amountToBorrow.toFixed(2)} ${quoteAsset}`);
    }

    // Calculate quantity to buy
    const rawQuantity = totalPositionSize / currentPrice;

    // Validate and format quantity to meet LOT_SIZE and MIN_NOTIONAL requirements
    const constraints = await getSymbolConstraints(config, signal.symbol);
    let finalQuantity = rawQuantity;
    
    if (constraints) {
      const validation = validateAndFormatOrderQuantity(rawQuantity, currentPrice, constraints);
      if (!validation.valid) {
        throw new Error(validation.error || "Order validation failed");
      }
      finalQuantity = validation.formattedQuantity;
      console.log(`Quantity validated: ${rawQuantity.toFixed(8)} → ${finalQuantity.toFixed(8)}`);
    }

    // Determine side effect type based on whether we need to borrow
    let sideEffectType: 'NO_SIDE_EFFECT' | 'MARGIN_BUY' | 'AUTO_REPAY' | 'AUTO_BORROW_REPAY';
    
    if (amountToBorrow > 0) {
      // Need to borrow
      sideEffectType = bot.autoRepay ? 'AUTO_BORROW_REPAY' : 'MARGIN_BUY';
    } else {
      // No borrowing needed (leverage = 1)
      sideEffectType = bot.autoRepay ? 'AUTO_REPAY' : 'NO_SIDE_EFFECT';
    }

    console.log(`Margin order details:`, {
      quantity: finalQuantity,
      price: currentPrice,
      totalValue: totalPositionSize,
      yourCapital: yourCapitalAllocation,
      borrowAmount: amountToBorrow,
      availableBalance: balance.available,
      sideEffect: sideEffectType,
      leverage
    });

    // Calculate stop loss and take profit
    const stopLoss = bot.stopLoss 
      ? currentPrice * (1 - bot.stopLoss / 100) 
      : null;
    
    const takeProfit = bot.takeProfit 
      ? currentPrice * (1 + bot.takeProfit / 100) 
      : null;

    // FIRST: Place margin order on exchange
    // Only create database records if exchange order succeeds
    console.log('Placing margin order on exchange...');
    const marginOrderResult = await placeMarginOrder(config, {
      symbol: signal.symbol,
      side: 'BUY',
      type: 'MARKET',
      quantity: finalQuantity.toString(),
      sideEffectType: sideEffectType as SideEffectType,
    });

    console.log('✅ Margin order successful:', marginOrderResult);

    // Use the actual executed quantity from Binance (it's already properly formatted)
    let executedQuantity = parseFloat(marginOrderResult.executedQty || marginOrderResult.origQty || finalQuantity.toString());
    const executedPrice = parseFloat(marginOrderResult.fills?.[0]?.price || currentPrice.toString());
    
    // Subtract commission if it was paid in the same asset (BTC for BTC/USDT)
    // This is important because Binance deducts the commission from the purchased asset
    if (marginOrderResult.fills && marginOrderResult.fills.length > 0) {
      const fill = marginOrderResult.fills[0];
      const commission = parseFloat(fill.commission || '0');
      const commissionAsset = fill.commissionAsset;
      
      // If commission was paid in base asset (buying BTC, commission in BTC)
      if (commissionAsset === baseAsset && commission > 0) {
        executedQuantity = executedQuantity - commission;
        console.log(`Commission deducted: ${commission} ${commissionAsset}, Net quantity: ${executedQuantity}`);
      }
    }
    
    console.log(`Executed: ${executedQuantity} @ ${executedPrice}`);

    // NOW: Create position in database (after successful exchange order)
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
        entryPrice: executedPrice,
        currentPrice: executedPrice,
        quantity: executedQuantity,
        entryValue: executedQuantity * executedPrice,
        borrowedAmount: amountToBorrow,
        borrowedAsset: quoteAsset,
        leverage: leverage,
        sideEffectType: sideEffectType,
        stopLoss,
        takeProfit,
        source: "BOT",
      },
    });

    // Create order in database with actual executed values
    const order = await db.order.create({
      data: {
        positionId: position.id,
        portfolioId: bot.portfolio.id,
        orderId: marginOrderResult.orderId?.toString() || `BOT-MARGIN-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        type: "ENTRY",
        side: "BUY",
        orderType: "MARKET",
        accountType: "MARGIN",
        marginType: "CROSS",
        symbol: signal.symbol,
        quantity: executedQuantity,
        price: executedPrice,
        value: executedQuantity * executedPrice,
        sideEffectType: sideEffectType,
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

    // Calculate position size using fixed trade amount
    // For MARGIN bots, use marginValue from the exchange for validation
    // Fallback to totalValue if marginValue is not available (migration not run or exchange not synced)
    const portfolioValue = bot.exchange.marginValue || bot.exchange.totalValue || 0;
    
    if (portfolioValue <= 0) {
      throw new Error("Invalid portfolio value. Please sync your exchange.");
    }

    // Use fixed trade amount - convert if in BASE currency
    let yourCapitalAllocation: number;
    if (bot.tradeAmountType === 'BASE') {
      // tradeAmount is in base currency (e.g., BTC), convert to quote value
      yourCapitalAllocation = (bot.tradeAmount || 0) * currentPrice;
    } else {
      // tradeAmount is in quote currency (e.g., USDT), use directly
      yourCapitalAllocation = bot.tradeAmount || 0;
    }
    
    // Apply leverage to get total position size
    const leverage = bot.leverage || 1;
    const totalPositionSize = yourCapitalAllocation * leverage;
    
    // For SHORT, calculate the quantity of base asset needed
    const totalQuantityNeeded = totalPositionSize / currentPrice;
    
    // Your capital in base asset terms
    const yourBaseAssetAllocation = yourCapitalAllocation / currentPrice;
    
    // Amount of base asset to borrow
    const baseAssetToBorrow = yourBaseAssetAllocation * (leverage - 1);
    
    console.log(`Short position calculation:`, {
      portfolioValue,
      tradeAmount: bot.tradeAmount,
      tradeAmountType: bot.tradeAmountType,
      yourCapitalAllocation,
      leverage,
      totalPositionSize,
      totalQuantityNeeded: totalQuantityNeeded + ' ' + baseAsset,
      yourBaseAssetAllocation: yourBaseAssetAllocation + ' ' + baseAsset,
      baseAssetToBorrow: baseAssetToBorrow + ' ' + baseAsset,
      currentPrice
    });

    // Configuration for API calls
    const config: configurationRestAPI = {
      apiKey: bot.exchange.apiKey,
      apiSecret: bot.exchange.apiSecret,
    };

    // Check if you have enough base asset
    const balance = await getMarginBalance(config, baseAsset);
    
    if (balance.available < yourBaseAssetAllocation) {
      throw new Error(
        `Insufficient ${baseAsset} balance. Need ${yourBaseAssetAllocation.toFixed(8)} ${baseAsset} but only have ${balance.available.toFixed(8)} available. ` +
        `For SHORT positions, you need collateral in the base asset.`
      );
    }

    // If leverage > 1, validate borrowing
    if (leverage > 1 && baseAssetToBorrow > 0) {
      // Get exchange's max borrowable amount for base asset
      const maxBorrowableData = await getMaxBorrowable(config, baseAsset);
      const exchangeMaxBorrowable = parseFloat(maxBorrowableData.amount || '0');
      
      // Calculate bot's max borrow limit (percentage of exchange's max)
      // If exchange allows 1 BTC and bot maxBorrowPercent is 50%, bot can only borrow 0.5 BTC
      const botMaxBorrowLimit = exchangeMaxBorrowable * (bot.maxBorrowPercent / 100);
      
      console.log(`Borrow limits (SHORT):`, {
        exchangeMaxBorrowable: exchangeMaxBorrowable.toFixed(8) + ' ' + baseAsset,
        botMaxBorrowPercent: bot.maxBorrowPercent + '%',
        botMaxBorrowLimit: botMaxBorrowLimit.toFixed(8) + ' ' + baseAsset,
        amountNeeded: baseAssetToBorrow.toFixed(8) + ' ' + baseAsset
      });
      
      // Check if amount needed exceeds bot's allowed limit
      if (baseAssetToBorrow > botMaxBorrowLimit) {
        throw new Error(
          `Cannot borrow ${baseAssetToBorrow.toFixed(8)} ${baseAsset}. ` +
          `Bot's max borrow limit is ${botMaxBorrowLimit.toFixed(8)} ${baseAsset} ` +
          `(${bot.maxBorrowPercent}% of exchange's ${exchangeMaxBorrowable.toFixed(8)} ${baseAsset} max). ` +
          `Increase maxBorrowPercent, reduce leverage, or reduce position size.`
        );
      }
      
      console.log(`✅ Borrow validation passed - borrowing ${baseAssetToBorrow.toFixed(8)} ${baseAsset}`);
    }

    // Validate and format quantity to meet LOT_SIZE and MIN_NOTIONAL requirements
    const constraints = await getSymbolConstraints(config, signal.symbol);
    let finalQuantity = totalQuantityNeeded;
    
    if (constraints) {
      const validation = validateAndFormatOrderQuantity(totalQuantityNeeded, currentPrice, constraints);
      if (!validation.valid) {
        throw new Error(validation.error || "Order validation failed");
      }
      finalQuantity = validation.formattedQuantity;
      console.log(`SHORT Quantity validated: ${totalQuantityNeeded.toFixed(8)} → ${finalQuantity.toFixed(8)}`);
    }

    // For short selling, we use MARGIN_BUY side effect to borrow base asset
    let sideEffectType: 'NO_SIDE_EFFECT' | 'MARGIN_BUY' | 'AUTO_REPAY' | 'AUTO_BORROW_REPAY';
    
    if (baseAssetToBorrow > 0) {
      // Need to borrow base asset for shorting
      sideEffectType = 'MARGIN_BUY';
    } else {
      // No borrowing needed (leverage = 1)
      sideEffectType = 'NO_SIDE_EFFECT';
    }

    console.log(`Margin short order details:`, {
      quantity: finalQuantity,
      price: currentPrice,
      totalValue: totalPositionSize,
      yourCapital: yourCapitalAllocation,
      borrowAmount: baseAssetToBorrow + ' ' + baseAsset,
      availableBalance: balance.available,
      sideEffect: sideEffectType,
      leverage
    });

    // Calculate stop loss and take profit (inverted for shorts)
    const stopLoss = bot.stopLoss 
      ? currentPrice * (1 + bot.stopLoss / 100) 
      : null;
    
    const takeProfit = bot.takeProfit 
      ? currentPrice * (1 - bot.takeProfit / 100) 
      : null;

    // FIRST: Place margin short order (SELL with MARGIN_BUY to borrow)
    // Only create database records if exchange order succeeds
    console.log('Placing margin SHORT order on exchange...');
    const marginOrderResult = await placeMarginOrder(config, {
      symbol: signal.symbol,
      side: 'SELL',
      type: 'MARKET',
      quantity: finalQuantity.toString(),
      sideEffectType: sideEffectType as SideEffectType,
    });

    console.log('✅ Margin SHORT order successful:', marginOrderResult);

    // Use the actual executed quantity from Binance (it's already properly formatted)
    let executedQuantity = parseFloat(marginOrderResult.executedQty || marginOrderResult.origQty || finalQuantity.toString());
    const executedPrice = parseFloat(marginOrderResult.fills?.[0]?.price || currentPrice.toString());
    
    // For SHORT positions, we're selling the base asset
    // Commission might be in quote asset (USDT) or base asset
    // We only need to adjust quantity if commission is in base asset
    if (marginOrderResult.fills && marginOrderResult.fills.length > 0) {
      const fill = marginOrderResult.fills[0];
      const commission = parseFloat(fill.commission || '0');
      const commissionAsset = fill.commissionAsset;
      
      // If commission was paid in base asset (selling BTC, commission in BTC)
      if (commissionAsset === baseAsset && commission > 0) {
        executedQuantity = executedQuantity - commission;
        console.log(`Commission deducted: ${commission} ${commissionAsset}, Net quantity: ${executedQuantity}`);
      }
    }
    
    console.log(`Executed SHORT: ${executedQuantity} @ ${executedPrice}`);

    // NOW: Create position in database (after successful exchange order)
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
        entryPrice: executedPrice,
        currentPrice: executedPrice,
        quantity: executedQuantity,
        entryValue: executedQuantity * executedPrice,
        borrowedAmount: baseAssetToBorrow,
        borrowedAsset: baseAsset,
        leverage: leverage,
        sideEffectType: sideEffectType,
        stopLoss,
        takeProfit,
        source: "BOT",
      },
    });

    // Create order in database with actual executed values
    const order = await db.order.create({
      data: {
        positionId: position.id,
        portfolioId: bot.portfolio.id,
        orderId: marginOrderResult.orderId?.toString() || `BOT-MARGIN-SHORT-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        type: "ENTRY",
        side: "SELL",
        orderType: "MARKET",
        accountType: "MARGIN",
        marginType: "CROSS",
        symbol: signal.symbol,
        quantity: executedQuantity,
        price: executedPrice,
        value: executedQuantity * executedPrice,
        sideEffectType: sideEffectType,
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
