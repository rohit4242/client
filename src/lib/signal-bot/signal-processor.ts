import db from "@/db";
import { SignalAction, BotTradeStatus } from "@prisma/client";
import { executeSignalTrade } from "./trade-executor";
import { validateSignal } from "./signal-validator";
import { calculatePositionSize } from "./position-calculator";
import { getPriceBySymbol } from "@/lib/trading-utils";
import { BotTrade, Signal, SignalBot } from "@/types/signal-bot";

export interface SignalProcessingResult {
  success: boolean;
  signalId: string;
  tradeId?: string;
  error?: string;
  message?: string;
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
    const validation = await validateSignal(signal, bot);
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

    // Get existing positions for this bot
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
        result = await processEnterLong(signal, bot, currentPrice, existingPositions);
        break;
      
      case SignalAction.EXIT_LONG:
        result = await processExitLong(signal, bot, currentPrice, existingPositions);
        break;
      
      case SignalAction.ENTER_SHORT:
        result = await processEnterShort(signal, bot, currentPrice, existingPositions);
        break;
      
      case SignalAction.EXIT_SHORT:
        result = await processExitShort(signal, bot, currentPrice, existingPositions);
        break;
      
      case SignalAction.EXIT_ALL:
        result = await processExitAll(signal, bot, currentPrice, existingPositions);
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
  const existingLong = existingPositions.find(p => p.side === "Long");
  if (existingLong) {
    return {
      success: true,
      signalId: signal.id,
      skipped: true,
      skipReason: "Already in long position",
      message: `Already in long position (Trade ID: ${existingLong.id})`,
    };
  }

  // Close any short positions first
  const existingShort = existingPositions.find(p => p.side === "Short");
  if (existingShort) {
    await executeSignalTrade({
      bot,
      signal,
      action: "EXIT_SHORT",
      currentPrice,
      existingTrade: existingShort,
    });
  }

  // Calculate position size
  const positionSize = await calculatePositionSize(bot, currentPrice);
  
  // Execute long entry
  const tradeResult = await executeSignalTrade({
    bot,
    signal,
    action: "ENTER_LONG",
    currentPrice,
    quantity: positionSize.quantity,
    value: positionSize.value,
  });

  return {
    success: true,
    signalId: signal.id,
    tradeId: tradeResult.tradeId,
    message: `Entered long position: ${positionSize.quantity} ${bot.symbol} at ${currentPrice}`,
  };
}

async function processExitLong(signal: Signal, bot: SignalBot, currentPrice: number, existingPositions: BotTrade[]): Promise<SignalProcessingResult> {
  const existingLong = existingPositions.find(p => p.side === "Long");
  
  if (!existingLong) {
    return {
      success: true,
      signalId: signal.id,
      skipped: true,
      skipReason: "No long position to exit",
      message: "No long position to exit",
    };
  }

  // Execute long exit
  const tradeResult = await executeSignalTrade({
    bot,
    signal,
    action: "EXIT_LONG",
    currentPrice,
    existingTrade: existingLong,
  });

  return {
    success: true,
    signalId: signal.id,
    tradeId: tradeResult.tradeId,
    message: `Exited long position: ${existingLong.quantity} ${bot.symbol} at ${currentPrice}`,
  };
}

async function processEnterShort(signal: Signal, bot: SignalBot, currentPrice: number, existingPositions: BotTrade[]): Promise<SignalProcessingResult> {
  // Check if already in short position
  const existingShort = existingPositions.find(p => p.side === "Short");
  if (existingShort) {
    return {
      success: true,
      signalId: signal.id,
      skipped: true,
      skipReason: "Already in short position",
      message: `Already in short position (Trade ID: ${existingShort.id})`,
    };
  }

  // Close any long positions first
  const existingLong = existingPositions.find(p => p.side === "Long");
  if (existingLong) {
    await executeSignalTrade({
      bot,
      signal,
      action: "EXIT_LONG",
      currentPrice,
      existingTrade: existingLong,
    });
  }

  // Calculate position size
  const positionSize = await calculatePositionSize(bot, currentPrice);
  
  // Execute short entry
  const tradeResult = await executeSignalTrade({
    bot,
    signal,
    action: "ENTER_SHORT",
    currentPrice,
    quantity: positionSize.quantity,
    value: positionSize.value,
  });

  return {
    success: true,
    signalId: signal.id,
    tradeId: tradeResult.tradeId,
    message: `Entered short position: ${positionSize.quantity} ${bot.symbol} at ${currentPrice}`,
  };
}

async function processExitShort(signal: Signal, bot: SignalBot, currentPrice: number, existingPositions: BotTrade[]): Promise<SignalProcessingResult> {
  const existingShort = existingPositions.find(p => p.side === "Short");
  
  if (!existingShort) {
    return {
      success: true,
      signalId: signal.id,
      skipped: true,
      skipReason: "No short position to exit",
      message: "No short position to exit",
    };
  }

  // Execute short exit
  const tradeResult = await executeSignalTrade({
    bot,
    signal,
    action: "EXIT_SHORT",
    currentPrice,
    existingTrade: existingShort,
  });

  return {
    success: true,
    signalId: signal.id,
    tradeId: tradeResult.tradeId,
    message: `Exited short position: ${existingShort.quantity} ${bot.symbol} at ${currentPrice}`,
  };
}

async function processExitAll(signal: Signal, bot: SignalBot, currentPrice: number, existingPositions: BotTrade[]): Promise<SignalProcessingResult> {
  if (existingPositions.length === 0) {
    return {
      success: true,
      signalId: signal.id,
      skipped: true,
      skipReason: "No positions to exit",
      message: "No positions to exit",
    };
  }

  const tradeIds: string[] = [];
  
  // Close all positions
  for (const position of existingPositions) {
    const action = position.side === "Long" ? "EXIT_LONG" : "EXIT_SHORT";
    const tradeResult = await executeSignalTrade({
      bot,
      signal,
      action,
      currentPrice,
      existingTrade: position,
    });
    tradeIds.push(tradeResult.tradeId);
  }

  return {
    success: true,
    signalId: signal.id,
    tradeId: tradeIds.join(","),
    message: `Closed ${existingPositions.length} position(s)`,
  };
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
