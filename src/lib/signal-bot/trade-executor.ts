import { Spot, SpotRestAPI } from "@binance/spot";
import db from "@/db";
import { BotTradeStatus, PositionSide, BotTradeType } from "@prisma/client";
import { BotTrade, Signal, SignalBot } from "@/types/signal-bot";

export interface TradeExecutionParams {
  bot: SignalBot;
  signal: Signal;
  action: "ENTER_LONG" | "EXIT_LONG" | "ENTER_SHORT" | "EXIT_SHORT";
  currentPrice: number;
  quantity?: number;
  value?: number;
  existingTrade?: BotTrade;
}

export interface TradeExecutionResult {
  success: boolean;
  tradeId: string;
  orderId?: number;
  executedPrice?: number;
  executedQuantity?: number;
  error?: string;
}

export async function executeSignalTrade(params: TradeExecutionParams): Promise<TradeExecutionResult> {
  const { bot, signal, action, currentPrice, quantity, value, existingTrade } = params;
  
  console.log(`Executing trade: ${action} for bot ${bot.name}`);

  try {
    // Configure Binance client
    if (!bot.exchange) {
      throw new Error("Bot exchange information is not available");
    }
    
    const configurationRestAPI = {
      apiKey: bot.exchange.apiKey,
      apiSecret: bot.exchange.apiSecret,
    };

    const client = new Spot({
      configurationRestAPI,
    });

    let binanceResponse;
    let tradeQuantity: number;
    let tradeSide: PositionSide;
    let isEntry = false;

    switch (action) {
      case "ENTER_LONG":
        // Buy order
        if (!quantity || !value) {
          throw new Error("Quantity and value required for entry");
        }
        
        binanceResponse = await client.restAPI.newOrder({
          symbol: signal.symbol,
          side: SpotRestAPI.NewOrderSideEnum.BUY,
          type: SpotRestAPI.NewOrderTypeEnum.MARKET,
          quoteOrderQty: Number(value),
        });
        
        tradeQuantity = Number(quantity);
        tradeSide = PositionSide.Long;
        isEntry = true;
        break;

      case "EXIT_LONG":
        // Sell order
        if (!existingTrade) {
          throw new Error("Existing trade required for exit");
        }
        
        binanceResponse = await client.restAPI.newOrder({
          symbol: signal.symbol,
          side: SpotRestAPI.NewOrderSideEnum.SELL,
          type: SpotRestAPI.NewOrderTypeEnum.MARKET,
          quantity: Number(existingTrade.quantity),
        });
        
        tradeQuantity = Number(existingTrade.quantity);
        tradeSide = PositionSide.Long;
        isEntry = false;
        break;

      case "ENTER_SHORT":
        // For spot trading, we simulate short by selling first (if we have the asset)
        // This is a simplified implementation - futures would be different
        if (!quantity || !value) {
          throw new Error("Quantity and value required for entry");
        }
        
        binanceResponse = await client.restAPI.newOrder({
          symbol: signal.symbol,
          side: SpotRestAPI.NewOrderSideEnum.SELL,
          type: SpotRestAPI.NewOrderTypeEnum.MARKET,
          quantity: Number(quantity),
        });
        
        tradeQuantity = Number(quantity);
        tradeSide = PositionSide.Short;
        isEntry = true;
        break;

      case "EXIT_SHORT":
        // Buy back to close short
        if (!existingTrade) {
          throw new Error("Existing trade required for exit");
        }
        
        binanceResponse = await client.restAPI.newOrder({
          symbol: signal.symbol,
          side: SpotRestAPI.NewOrderSideEnum.BUY,
          type: SpotRestAPI.NewOrderTypeEnum.MARKET,
          quantity: Number(existingTrade.quantity),
        });
        
        tradeQuantity = Number(existingTrade.quantity);
        tradeSide = PositionSide.Short;
        isEntry = false;
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    const orderData = await binanceResponse.data();
    console.log("Binance order response:", orderData);

    // Calculate executed price and quantity
    let executedPrice = currentPrice;
    let executedQuantity = tradeQuantity;

    if (orderData.fills && orderData.fills.length > 0) {
      const totalQuantity = orderData.fills.reduce((sum: number, fill) => {
        const qty = fill.qty || 0;
        return sum + parseFloat(qty.toString());
      }, 0);
      
      const totalValue = orderData.fills.reduce((sum: number, fill) => {
        const price = fill.price || 0;
        const qty = fill.qty || 0;
        return sum + (parseFloat(price.toString()) * parseFloat(qty.toString()));
      }, 0);
      
      const weightedPrice = totalQuantity > 0 ? totalValue / totalQuantity : currentPrice;
      
      executedPrice = weightedPrice;
      executedQuantity = totalQuantity;
    }

    if (isEntry) {
      // Create new bot trade for entry
      const stopLoss = bot.stopLoss ? executedPrice * (1 - bot.stopLoss / 100) : null;
      const takeProfit = bot.takeProfit ? executedPrice * (1 + bot.takeProfit / 100) : null;

      const botTrade = await db.botTrade.create({
        data: {
          botId: bot.id,
          signalId: signal.id,
          symbol: signal.symbol,
          side: tradeSide,
          entryPrice: executedPrice,
          quantity: executedQuantity,
          entryValue: executedPrice * executedQuantity,
          entryTime: new Date(),
          status: BotTradeStatus.Open,
          stopLoss,
          takeProfit,
          tradeType: BotTradeType.Signal,
        },
      });

      // Update bot statistics
      await db.signalBot.update({
        where: { id: bot.id },
        data: {
          totalTrades: { increment: 1 },
        },
      });

      return {
        success: true,
        tradeId: botTrade.id,
        orderId: orderData.orderId,
        executedPrice,
        executedQuantity,
      };

    } else {
      // Update existing trade for exit
      if (!existingTrade) {
        throw new Error("No existing trade to update");
      }

      const profit = tradeSide === PositionSide.Long 
        ? (executedPrice - existingTrade.entryPrice) * executedQuantity
        : (existingTrade.entryPrice - executedPrice) * executedQuantity;

      const profitPercentage = (profit / existingTrade.entryValue) * 100;

      const updatedTrade = await db.botTrade.update({
        where: { id: existingTrade.id },
        data: {
          status: BotTradeStatus.Closed,
          exitPrice: executedPrice,
          exitTime: new Date(),
          exitValue: executedPrice * executedQuantity,
          profit,
          profitPercentage,
        },
      });

      // Update bot statistics
      const isWinningTrade = profit > 0;
      await db.signalBot.update({
        where: { id: bot.id },
        data: {
          winningTrades: isWinningTrade ? { increment: 1 } : undefined,
          totalPnl: { increment: profit },
        },
      });

      return {
        success: true,
        tradeId: updatedTrade.id,
        orderId: orderData.orderId,
        executedPrice,
        executedQuantity,
      };
    }

  } catch (error) {
    console.error("Trade execution error:", error);
    
    // Log the error but don't create failed trade records for now
    // Could be enhanced to create failed trade records for audit trail
    
    throw error;
  }
}

// Helper function to calculate stop loss and take profit prices
export function calculateStopLossPrice(entryPrice: number, side: PositionSide, stopLossPercent: number): number {
  if (side === PositionSide.Long) {
    return entryPrice * (1 - stopLossPercent / 100);
  } else {
    return entryPrice * (1 + stopLossPercent / 100);
  }
}

export function calculateTakeProfitPrice(entryPrice: number, side: PositionSide, takeProfitPercent: number): number {
  if (side === PositionSide.Long) {
    return entryPrice * (1 + takeProfitPercent / 100);
  } else {
    return entryPrice * (1 - takeProfitPercent / 100);
  }
}

// Function to check if stop loss or take profit should be triggered
export async function checkStopLossTakeProfit(botId: string, currentPrice: number): Promise<void> {
  const openTrades = await db.botTrade.findMany({
    where: {
      botId,
      status: BotTradeStatus.Open,
    },
    include: {
      bot: {
        include: {
          exchange: true,
        },
      },
    },
  });

  for (const trade of openTrades) {
    let shouldExit = false;
    let exitReason = "";

    // Check stop loss
    if (trade.stopLoss) {
      const stopLossPrice = Number(trade.stopLoss);
      if (trade.side === PositionSide.Long && currentPrice <= stopLossPrice) {
        shouldExit = true;
        exitReason = "Stop Loss";
      } else if (trade.side === PositionSide.Short && currentPrice >= stopLossPrice) {
        shouldExit = true;
        exitReason = "Stop Loss";
      }
    }

    // Check take profit
    if (!shouldExit && trade.takeProfit) {
      const takeProfitPrice = Number(trade.takeProfit);
      if (trade.side === PositionSide.Long && currentPrice >= takeProfitPrice) {
        shouldExit = true;
        exitReason = "Take Profit";
      } else if (trade.side === PositionSide.Short && currentPrice <= takeProfitPrice) {
        shouldExit = true;
        exitReason = "Take Profit";
      }
    }

    if (shouldExit) {
      console.log(`Triggering ${exitReason} for trade ${trade.id} at price ${currentPrice}`);
      
      try {
        // Create a synthetic signal for the exit
        const exitSignal = await db.signal.create({
          data: {
            botId: trade.botId,
            action: trade.side === PositionSide.Long ? "EXIT_LONG" : "EXIT_SHORT",
            symbol: trade.symbol,
            price: currentPrice,
            message: `Automated ${exitReason}`,
            processed: false,
          },
        });

        const action = trade.side === PositionSide.Long ? "EXIT_LONG" : "EXIT_SHORT";
        
        // Convert database types to our interface types
        const botForExecution: SignalBot = {
          ...trade.bot,
          portfolioPercent: trade.bot.portfolioPercent,
          stopLoss: trade.bot.stopLoss ? Number(trade.bot.stopLoss) : null,
          takeProfit: trade.bot.takeProfit ? Number(trade.bot.takeProfit) : null,
          totalPnl: Number(trade.bot.totalPnl),
          createdAt: trade.bot.createdAt,
          updatedAt: trade.bot.updatedAt,
        };

        const signalForExecution: Signal = {
          ...exitSignal,
          price: exitSignal.price ? exitSignal.price : null,
          createdAt: exitSignal.createdAt,
          processedAt: exitSignal.processedAt ? exitSignal.processedAt : null,
        };

        const tradeForExecution: BotTrade = {
          ...trade,
          entryPrice: Number(trade.entryPrice),
          quantity: Number(trade.quantity),
          entryValue: Number(trade.entryValue),
          exitPrice: trade.exitPrice ? Number(trade.exitPrice) : null,
          exitValue: trade.exitValue ? Number(trade.exitValue) : null,
          profit: trade.profit ? Number(trade.profit) : null,
          profitPercentage: trade.profitPercentage ? Number(trade.profitPercentage) : null,
          stopLoss: trade.stopLoss ? Number(trade.stopLoss) : null,
          takeProfit: trade.takeProfit ? Number(trade.takeProfit) : null,
          entryTime: trade.entryTime,
          exitTime: trade.exitTime ? trade.exitTime : null,
          createdAt: trade.createdAt,
          updatedAt: trade.updatedAt,
        };

        await executeSignalTrade({
          bot: botForExecution,
          signal: signalForExecution,
          action,
          currentPrice,
          existingTrade: tradeForExecution,
        });

        // Mark the signal as processed
        await db.signal.update({
          where: { id: exitSignal.id },
          data: {
            processed: true,
            processedAt: new Date(),
          },
        });

      } catch (error) {
        console.error(`Failed to execute ${exitReason} for trade ${trade.id}:`, error);
      }
    }
  }
}
