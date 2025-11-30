import db from "@/db";
import { placeMarginOrder } from "@/lib/margin/binance-margin";
import { configurationRestAPI } from "@/types/binance";
import { getPriceBySymbol } from "@/lib/trading-utils";

/**
 * Monitor positions for take profit and stop loss triggers
 * This should be called periodically (e.g., every 30 seconds)
 */
export async function monitorPositions() {
  console.log("🔍 Monitoring positions for TP/SL...");

  try {
    // Get all open positions that have take profit or stop loss set
    const positions = await db.position.findMany({
      where: {
        status: "OPEN",
        OR: [
          { takeProfit: { not: null } },
          { stopLoss: { not: null } },
        ],
      },
      include: {
        bot: true,
        portfolio: {
          include: {
            exchanges: true,
          },
        },
      },
    });

    console.log(`📊 Found ${positions.length} positions to monitor`);

    for (const position of positions) {
      try {
        // Skip if no active exchange
        const activeExchange = position.portfolio.exchanges.find(ex => ex.isActive);
        if (!activeExchange) {
          console.log(`⚠️ No active exchange for position ${position.id}`);
          continue;
        }

        const config: configurationRestAPI = {
          apiKey: activeExchange.apiKey,
          apiSecret: activeExchange.apiSecret,
        };

        // Get current price
        const priceData = await getPriceBySymbol(config, position.symbol);
        const currentPrice = typeof priceData === 'object' && 'price' in priceData
          ? parseFloat(priceData.price as string)
          : typeof priceData === 'string'
          ? parseFloat(priceData)
          : typeof priceData === 'number'
          ? priceData
          : 0;

        if (!currentPrice || currentPrice <= 0) {
          console.log(`⚠️ Invalid price for ${position.symbol}`);
          continue;
        }

        // Update current price in database
        await db.position.update({
          where: { id: position.id },
          data: { currentPrice },
        });

        console.log(`📈 ${position.symbol}: Current=$${currentPrice}, Entry=$${position.entryPrice}`);

        // Check take profit and stop loss
        const shouldClose = await checkTakeProfitStopLoss(position, currentPrice);

        if (shouldClose.shouldClose) {
          console.log(`🎯 Closing position ${position.id} - ${shouldClose.reason}`);
          
          // Close the position
          await closePositionAutomatically(position, currentPrice, shouldClose.reason, config);
        }

      } catch (error) {
        console.error(`Error monitoring position ${position.id}:`, error);
      }
    }

    console.log("✅ Position monitoring completed");
  } catch (error) {
    console.error("Error in position monitoring:", error);
  }
}

/**
 * Check if position should be closed due to take profit or stop loss
 */
async function checkTakeProfitStopLoss(
  position: any,
  currentPrice: number
): Promise<{ shouldClose: true; reason: string } | { shouldClose: false }> {
  const { side, entryPrice, takeProfit, stopLoss } = position;

  if (side === "LONG") {
    // For LONG positions
    
    // Check take profit (price went UP)
    if (takeProfit && currentPrice >= takeProfit) {
      const profitPercent = ((currentPrice - entryPrice) / entryPrice) * 100;
      return {
        shouldClose: true,
        reason: `Take Profit hit: ${currentPrice.toFixed(2)} >= ${takeProfit.toFixed(2)} (${profitPercent.toFixed(2)}% profit)`,
      };
    }

    // Check stop loss (price went DOWN)
    if (stopLoss && currentPrice <= stopLoss) {
      const lossPercent = ((entryPrice - currentPrice) / entryPrice) * 100;
      return {
        shouldClose: true,
        reason: `Stop Loss hit: ${currentPrice.toFixed(2)} <= ${stopLoss.toFixed(2)} (${lossPercent.toFixed(2)}% loss)`,
      };
    }
  } else if (side === "SHORT") {
    // For SHORT positions (inverted)
    
    // Check take profit (price went DOWN)
    if (takeProfit && currentPrice <= takeProfit) {
      const profitPercent = ((entryPrice - currentPrice) / entryPrice) * 100;
      return {
        shouldClose: true,
        reason: `Take Profit hit: ${currentPrice.toFixed(2)} <= ${takeProfit.toFixed(2)} (${profitPercent.toFixed(2)}% profit)`,
      };
    }

    // Check stop loss (price went UP)
    if (stopLoss && currentPrice >= stopLoss) {
      const lossPercent = ((currentPrice - entryPrice) / entryPrice) * 100;
      return {
        shouldClose: true,
        reason: `Stop Loss hit: ${currentPrice.toFixed(2)} >= ${stopLoss.toFixed(2)} (${lossPercent.toFixed(2)}% loss)`,
      };
    }
  }

  return { shouldClose: false };
}

/**
 * Format quantity to proper precision
 */
function formatQuantityPrecision(quantity: number, symbol: string): number {
  let precision = 6;
  
  if (symbol.includes('BTC')) precision = 5;
  else if (symbol.includes('ETH')) precision = 4;
  else if (symbol.includes('USDT')) precision = 3;
  
  const multiplier = Math.pow(10, precision);
  return Math.floor(quantity * multiplier) / multiplier;
}

/**
 * Close position automatically when TP/SL is hit
 */
async function closePositionAutomatically(
  position: any,
  currentPrice: number,
  reason: string,
  config: configurationRestAPI
) {
  try {
    console.log(`🔄 Auto-closing position ${position.symbol}...`);

    // Atomically verify position is still OPEN using transaction
    // This prevents race conditions with EXIT signals
    const lockedPosition = await db.$transaction(async (tx) => {
      const pos = await tx.position.findFirst({
        where: {
          id: position.id,
          status: "OPEN",
        },
      });

      if (!pos) {
        return null;
      }

      // Double-check it's still OPEN
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

    if (!lockedPosition) {
      console.log(`⚠️ Position ${position.id} already closed or being closed, skipping`);
      return;
    }

    // Use the locked position data
    position = lockedPosition;

    // Determine side for closing
    const closeSide = position.side === "LONG" ? "SELL" : "BUY";
    
    // Format quantity
    const formattedQuantity = formatQuantityPrecision(position.quantity, position.symbol);

    // Check if margin position
    if (position.accountType === "MARGIN") {
      // Use Margin API with proper side effect
      const sideEffectType = position.bot?.autoRepay ? 'AUTO_REPAY' : 'NO_SIDE_EFFECT';
      
      console.log(`Closing MARGIN position with ${sideEffectType}`);

      const marginOrderResult = await placeMarginOrder(config, {
        symbol: position.symbol,
        side: closeSide as 'BUY' | 'SELL',
        type: 'MARKET',
        quantity: formattedQuantity.toString(),
        sideEffectType: sideEffectType as 'NO_SIDE_EFFECT' | 'AUTO_REPAY',
      });

      console.log('✅ Margin close order executed:', marginOrderResult);

      // Calculate P&L
      const exitValue = position.quantity * currentPrice;
      const pnl = position.side === "LONG" 
        ? exitValue - position.entryValue
        : position.entryValue - exitValue;
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
          currentPrice,
        },
      });

      // Create exit order record
      await db.order.create({
        data: {
          positionId: position.id,
          portfolioId: position.portfolioId,
          orderId: marginOrderResult.orderId?.toString() || `AUTO-${Date.now()}`,
          type: "EXIT",
          side: closeSide,
          orderType: "MARKET",
          accountType: "MARGIN",
          marginType: position.marginType,
          symbol: position.symbol,
          quantity: position.quantity,
          price: currentPrice,
          value: exitValue,
          sideEffectType: sideEffectType as any,
          status: "FILLED",
          fillPercent: 100,
          pnl,
        },
      });

      // Update bot stats if this is a bot position
      if (position.botId) {
        await db.bot.update({
          where: { id: position.botId },
          data: {
            totalTrades: { increment: 1 },
            winTrades: pnl > 0 ? { increment: 1 } : undefined,
            lossTrades: pnl <= 0 ? { increment: 1 } : undefined,
            totalPnl: { increment: pnl },
          },
        });
      }

      console.log(`✅ Position closed: ${reason}, P&L: ${pnl.toFixed(2)} (${pnlPercent.toFixed(2)}%)`);

      // Recalculate portfolio stats
      try {
        const { recalculatePortfolioStatsInternal } = await import("@/db/actions/portfolio/recalculate-stats");
        await recalculatePortfolioStatsInternal(position.portfolio.userId);
      } catch (statsError) {
        console.error("Failed to update portfolio stats:", statsError);
      }

    } else {
      // For SPOT positions, use spot API
      const { Spot } = await import("@binance/spot");
      const client = new Spot({ configurationRestAPI: config });

      console.log(`Closing SPOT position`);

      // Place spot order
      const orderResponse = await client.restAPI.newOrder({
        symbol: position.symbol,
        side: closeSide,
        type: 'MARKET',
        quantity: formattedQuantity,
      } as any);

      const orderData = await orderResponse.data();
      console.log('✅ Spot close order executed:', orderData);

      // Calculate P&L
      const exitValue = position.quantity * currentPrice;
      const pnl = position.side === "LONG" 
        ? exitValue - position.entryValue
        : position.entryValue - exitValue;
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
          currentPrice,
        },
      });

      // Create exit order record
      await db.order.create({
        data: {
          positionId: position.id,
          portfolioId: position.portfolioId,
          orderId: orderData.orderId?.toString() || `AUTO-${Date.now()}`,
          type: "EXIT",
          side: closeSide,
          orderType: "MARKET",
          symbol: position.symbol,
          quantity: position.quantity,
          price: currentPrice,
          value: exitValue,
          status: "FILLED",
          fillPercent: 100,
          pnl,
        },
      });

      // Update bot stats if this is a bot position
      if (position.botId) {
        await db.bot.update({
          where: { id: position.botId },
          data: {
            totalTrades: { increment: 1 },
            winTrades: pnl > 0 ? { increment: 1 } : undefined,
            lossTrades: pnl <= 0 ? { increment: 1 } : undefined,
            totalPnl: { increment: pnl },
          },
        });
      }

      console.log(`✅ Position closed: ${reason}, P&L: ${pnl.toFixed(2)} (${pnlPercent.toFixed(2)}%)`);
    }

  } catch (error) {
    console.error(`Error closing position ${position.id}:`, error);
    // Position remains OPEN on failure (no status change needed)
    throw error;
  }
}

