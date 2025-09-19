import { Spot, SpotRestAPI } from "@binance/spot";
import db from "@/db";
import { BotTradeStatus, PositionSide } from "@prisma/client";
import { BotTrade, OrderType, Signal, SignalBot } from "@/types/signal-bot";
import { calculateTotalUSDValue } from "@/lib/trading-utils";

// Interface for Binance order parameters
interface BinanceOrderParams {
  symbol: string;
  side: SpotRestAPI.NewOrderSideEnum;
  type: SpotRestAPI.NewOrderTypeEnum;
  quantity?: number;
  quoteOrderQty?: number;
  price?: number;
  timeInForce?: SpotRestAPI.NewOrderTimeInForceEnum;
}

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

// Simplified trade amount calculation
export async function calculateTradeAmount(bot: SignalBot, signal: Signal, currentPrice: number): Promise<{ quantity: number; value: number }> {
  // Use custom quantity if provided
  if (signal.quantity && signal.quantity > 0) {
    const quantity = signal.quantity;
    const value = quantity * currentPrice;
    return { quantity, value };
  }

  // Get portfolio value
  const configurationRestAPI = {
    apiKey: bot.exchange!.apiKey,
    apiSecret: bot.exchange!.apiSecret,
  };

  const portfolioValue = await calculateTotalUSDValue(configurationRestAPI);
  
  // Calculate position value based on portfolio percentage
  const positionValue = (portfolioValue * bot.portfolioPercent) / 100;
  
  // Calculate quantity
  const quantity = positionValue / currentPrice;
  
  return { quantity, value: positionValue };
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

    // Calculate trade amounts if not provided
    let tradeQuantity: number;
    let tradeValue: number;
    
    if (!quantity || !value) {
      const calculatedAmounts = await calculateTradeAmount(bot, signal, currentPrice);
      tradeQuantity = calculatedAmounts.quantity;
      tradeValue = calculatedAmounts.value;
    } else {
      tradeQuantity = quantity;
      tradeValue = value;
    }

    let binanceResponse;
    let tradeSide: PositionSide;
    let isEntry = false;

    switch (action) {
      case "ENTER_LONG":
        const buyOrderParams: BinanceOrderParams = {
          symbol: signal.symbol,
          side: SpotRestAPI.NewOrderSideEnum.BUY,
          type: SpotRestAPI.NewOrderTypeEnum.MARKET,
          quoteOrderQty: Number(tradeValue),
        };

        binanceResponse = await client.restAPI.newOrder(buyOrderParams);
        tradeSide = PositionSide.Long;
        isEntry = true;
        break;

      case "EXIT_LONG":
        if (!existingTrade) {
          throw new Error("No existing long position to exit");
        }

        const sellOrderParams: BinanceOrderParams = {
          symbol: signal.symbol,
          side: SpotRestAPI.NewOrderSideEnum.SELL,
          type: SpotRestAPI.NewOrderTypeEnum.MARKET,
          quantity: Number(existingTrade.quantity),
        };

        binanceResponse = await client.restAPI.newOrder(sellOrderParams);
        tradeSide = PositionSide.Long;
        break;

      case "ENTER_SHORT":
        // For spot trading, short positions are simulated by selling first
        const sellShortOrderParams: BinanceOrderParams = {
          symbol: signal.symbol,
          side: SpotRestAPI.NewOrderSideEnum.SELL,
          type: SpotRestAPI.NewOrderTypeEnum.MARKET,
          quantity: Number(tradeQuantity),
        };

        binanceResponse = await client.restAPI.newOrder(sellShortOrderParams);
        tradeSide = PositionSide.Short;
        isEntry = true;
        break;

      case "EXIT_SHORT":
        if (!existingTrade) {
          throw new Error("No existing short position to exit");
        }

        const buyShortOrderParams: BinanceOrderParams = {
          symbol: signal.symbol,
          side: SpotRestAPI.NewOrderSideEnum.BUY,
          type: SpotRestAPI.NewOrderTypeEnum.MARKET,
          quoteOrderQty: Number(existingTrade.quantity * currentPrice),
        };

        binanceResponse = await client.restAPI.newOrder(buyShortOrderParams);
        tradeSide = PositionSide.Short;
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    const orderData = await binanceResponse.data();
    console.log("Order executed:", orderData);

    // Extract execution details
    const executedPrice = parseFloat(orderData.price || currentPrice.toString());
    const executedQuantity = parseFloat(orderData.executedQty || tradeQuantity.toString());

    if (isEntry) {
      // Create new trade record
      const stopLossPrice = bot.stopLoss ? calculateStopLossPrice(executedPrice, tradeSide, bot.stopLoss) : null;
      const takeProfitPrice = bot.takeProfit ? calculateTakeProfitPrice(executedPrice, tradeSide, bot.takeProfit) : null;

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
          stopLoss: stopLossPrice,
          takeProfit: takeProfitPrice,
          orderType: bot.orderType,
          leverage: bot.leverage,
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
    throw error;
  }
}

// Helper function to calculate stop loss price
export function calculateStopLossPrice(entryPrice: number, side: PositionSide, stopLossPercent: number): number {
  if (side === PositionSide.Long) {
    return entryPrice * (1 - stopLossPercent / 100);
  } else {
    return entryPrice * (1 + stopLossPercent / 100);
  }
}

// Helper function to calculate take profit price
export function calculateTakeProfitPrice(entryPrice: number, side: PositionSide, takeProfitPercent: number): number {
  if (side === PositionSide.Long) {
    return entryPrice * (1 + takeProfitPercent / 100);
  } else {
    return entryPrice * (1 - takeProfitPercent / 100);
  }
}