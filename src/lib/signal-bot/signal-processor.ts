import db from "@/db";
import { SignalAction, BotTradeStatus } from "@prisma/client";
import { Signal, SignalBot, BotTrade } from "@/types/signal-bot";
import { validateSignal } from "./signal-validator";
import { executeSignalTrade } from "./trade-executor";
import { getPriceBySymbol } from "@/lib/trading-utils";

export interface SignalProcessingResult {
  success: boolean;
  signalId: string;
  tradeId?: string;
  error?: string;
  skipped?: boolean;
  skipReason?: string;
}

export async function processSignal(signalId: string): Promise<SignalProcessingResult> {
  console.log(`Processing signal: ${signalId}`);

  try {
    // Get signal with bot details
    const signal = await db.signal.findUnique({
      where: { id: signalId },
      include: {
        bot: {
          include: {
            exchange: true,
            userAccount: true,
          },
        },
      },
    });

    if (!signal) {
      throw new Error("Signal not found");
    }

    if (signal.processed) {
      return {
        success: false,
        signalId,
        error: "Signal already processed",
      };
    }

    const { bot } = signal;

    // Validate signal
    const validation = await validateSignal(signal, bot as SignalBot);
    if (!validation.isValid) {
      await updateSignalError(signalId, validation.error || "Unknown error");
      return {
        success: false,
        signalId,
        error: validation.error,
      };
    }

    // Get current price
    const configurationRestAPI = {
      apiKey: bot.exchange.apiKey,
      apiSecret: bot.exchange.apiSecret,
    };

    const priceData = await getPriceBySymbol(configurationRestAPI, signal.symbol);
    const currentPrice = parseFloat((priceData as unknown as { price: string }).price);

    // Get existing positions for this bot and symbol
    const existingPositions = await db.botTrade.findMany({
      where: {
        botId: bot.id,
        symbol: signal.symbol,
        status: BotTradeStatus.Open,
      },
    });

    // Process based on signal action
    let result: SignalProcessingResult;

    switch (signal.action) {
      case SignalAction.ENTER_LONG:
        result = await processEnterLong(signal, bot as SignalBot, currentPrice, existingPositions);
        break;
      
      case SignalAction.EXIT_LONG:
        result = await processExitLong(signal, bot as SignalBot, currentPrice, existingPositions);
        break;
      
      case SignalAction.ENTER_SHORT:
        result = await processEnterShort(signal, bot as SignalBot, currentPrice, existingPositions);
        break;
      
      case SignalAction.EXIT_SHORT:
        result = await processExitShort(signal, bot as SignalBot, currentPrice, existingPositions);
        break;
      
      default:
        throw new Error(`Unknown signal action: ${signal.action}`);
    }

    // Update signal as processed
    await db.signal.update({
      where: { id: signalId },
      data: {
        processed: true,
        processedAt: new Date(),
        error: result.success ? null : result.error,
      },
    });

    return result;

  } catch (error) {
    console.error("Signal processing error:", error);
    await updateSignalError(signalId, error instanceof Error ? error.message : "Unknown error");
    
    return {
      success: false,
      signalId,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function processEnterLong(signal: Signal, bot: SignalBot, currentPrice: number, existingPositions: BotTrade[]): Promise<SignalProcessingResult> {
  // Check if already in long position
  const hasLongPosition = existingPositions.some(p => p.side === "Long");
  
  if (hasLongPosition) {
    return {
      success: false,
      signalId: signal.id,
      skipped: true,
      skipReason: "Already in long position for this symbol",
    };
  }

  // Calculate position size
  const quantity = await calculatePositionSize(bot, signal, currentPrice);
  const value = quantity * currentPrice;

  try {
    const tradeResult = await executeSignalTrade({
      bot,
      signal,
      action: "ENTER_LONG",
      currentPrice,
      quantity,
      value,
    });

    return {
      success: true,
      signalId: signal.id,
      tradeId: tradeResult.tradeId,
    };

  } catch (error) {
    return {
      success: false,
      signalId: signal.id,
      error: error instanceof Error ? error.message : "Trade execution failed",
    };
  }
}

async function processExitLong(signal: Signal, bot: SignalBot, currentPrice: number, existingPositions: BotTrade[]): Promise<SignalProcessingResult> {
  // Find long position to exit
  const longPosition = existingPositions.find(p => p.side === "Long");
  
  if (!longPosition) {
    return {
      success: false,
      signalId: signal.id,
      skipped: true,
      skipReason: "No long position to exit for this symbol",
    };
  }

  try {
    const tradeResult = await executeSignalTrade({
      bot,
      signal,
      action: "EXIT_LONG",
      currentPrice,
      quantity: longPosition.quantity,
      value: longPosition.quantity * currentPrice,
      existingTrade: longPosition,
    });

    return {
      success: true,
      signalId: signal.id,
      tradeId: tradeResult.tradeId,
    };

  } catch (error) {
    return {
      success: false,
      signalId: signal.id,
      error: error instanceof Error ? error.message : "Trade execution failed",
    };
  }
}

async function processEnterShort(signal: Signal, bot: SignalBot, currentPrice: number, existingPositions: BotTrade[]): Promise<SignalProcessingResult> {
  // Check if already in short position
  const hasShortPosition = existingPositions.some(p => p.side === "Short");
  
  if (hasShortPosition) {
    return {
      success: false,
      signalId: signal.id,
      skipped: true,
      skipReason: "Already in short position for this symbol",
    };
  }

  // Calculate position size
  const quantity = await calculatePositionSize(bot, signal, currentPrice);
  const value = quantity * currentPrice;

  try {
    const tradeResult = await executeSignalTrade({
      bot,
      signal,
      action: "ENTER_SHORT",
      currentPrice,
      quantity,
      value,
    });

    return {
      success: true,
      signalId: signal.id,
      tradeId: tradeResult.tradeId,
    };

  } catch (error) {
    return {
      success: false,
      signalId: signal.id,
      error: error instanceof Error ? error.message : "Trade execution failed",
    };
  }
}

async function processExitShort(signal: Signal, bot: SignalBot, currentPrice: number, existingPositions: BotTrade[]): Promise<SignalProcessingResult> {
  // Find short position to exit
  const shortPosition = existingPositions.find(p => p.side === "Short");
  
  if (!shortPosition) {
    return {
      success: false,
      signalId: signal.id,
      skipped: true,
      skipReason: "No short position to exit for this symbol",
    };
  }

  try {
    const tradeResult = await executeSignalTrade({
      bot,
      signal,
      action: "EXIT_SHORT",
      currentPrice,
      quantity: shortPosition.quantity,
      value: shortPosition.quantity * currentPrice,
      existingTrade: shortPosition,
    });

    return {
      success: true,
      signalId: signal.id,
      tradeId: tradeResult.tradeId,
    };

  } catch (error) {
    return {
      success: false,
      signalId: signal.id,
      error: error instanceof Error ? error.message : "Trade execution failed",
    };
  }
}

async function calculatePositionSize(bot: SignalBot, signal: Signal, currentPrice: number): Promise<number> {
  // If custom quantity is provided in signal, use it
  if (signal.quantity && signal.quantity > 0) {
    return signal.quantity;
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
  
  return quantity;
}

async function updateSignalError(signalId: string, error: string): Promise<void> {
  await db.signal.update({
    where: { id: signalId },
    data: {
      processed: true,
      processedAt: new Date(),
      error,
    },
  });
}

// Import the calculateTotalUSDValue function
import { calculateTotalUSDValue } from "@/lib/trading-utils";