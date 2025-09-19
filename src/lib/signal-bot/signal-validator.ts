import db from "@/db";
import { calculateTotalUSDValue } from "@/lib/trading-utils";
import { Signal, SignalAction, SignalBot } from "@/types/signal-bot";

export interface SignalValidationResult {
  isValid: boolean;
  error?: string;
  warnings?: string[];
}

export async function validateSignal(signal: Signal, bot: SignalBot): Promise<SignalValidationResult> {
  const warnings: string[] = [];

  try {
    // Check if bot is active
    if (!bot.isActive) {
      return {
        isValid: false,
        error: "Bot is not active",
      };
    }

    // Check if exchange is active
    if (!bot.exchange!.isActive) {
      return {
        isValid: false,
        error: "Exchange is not active",
      };
    }

    // Validate API credentials exist
    if (!bot.exchange!.apiKey || !bot.exchange!.apiSecret) {
      return {
        isValid: false,
        error: "Exchange API credentials not configured",
      };
    }

    // Validate symbol is in bot's configured symbols
    if (!bot.symbols.includes(signal.symbol)) {
      return {
        isValid: false,
        error: `Symbol ${signal.symbol} is not configured for this bot`,
      };
    }

    // Validate custom quantity if provided
    if (signal.quantity && signal.quantity <= 0) {
      return {
        isValid: false,
        error: "Invalid custom quantity: must be greater than 0",
      };
    }

    // Check daily trade limits
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayTrades = await db.botTrade.count({
      where: {
        botId: bot.id,
        createdAt: {
          gte: today,
        },
      },
    });

    const maxDailyTrades = 50; // Could be configurable per bot
    if (todayTrades >= maxDailyTrades) {
      return {
        isValid: false,
        error: `Daily trade limit reached (${maxDailyTrades})`,
      };
    }

    // Check daily loss limits
    const todayPnL = await db.botTrade.aggregate({
      where: {
        botId: bot.id,
        createdAt: {
          gte: today,
        },
        status: "Closed",
      },
      _sum: {
        profit: true,
      },
    });

    const todayLoss = todayPnL._sum.profit ? Number(todayPnL._sum.profit) : 0;
    const maxDailyLoss = -1000; // Could be configurable per bot
    
    if (todayLoss < maxDailyLoss) {
      return {
        isValid: false,
        error: `Daily loss limit reached ($${Math.abs(maxDailyLoss)})`,
      };
    }

    // Check portfolio balance
    const configurationRestAPI = {
      apiKey: bot.exchange!.apiKey,
      apiSecret: bot.exchange!.apiSecret,
    };

    try {
      const portfolioValue = await calculateTotalUSDValue(configurationRestAPI);
      
      if (portfolioValue < 100) { // Minimum portfolio value
        return {
          isValid: false,
          error: "Portfolio value too low for trading",
        };
      }

      // Add warning if portfolio is getting low
      if (portfolioValue < 500) {
        warnings.push("Portfolio value is getting low");
      }

    } catch (balanceError) {
      console.error("Error checking portfolio balance:", balanceError);
      return {
        isValid: false,
        error: "Unable to verify portfolio balance",
      };
    }

    // Check for conflicting signals (too frequent)
    const recentSignals = await db.signal.count({
      where: {
        botId: bot.id,
        createdAt: {
          gte: new Date(Date.now() - 60000), // Last minute
        },
      },
    });

    if (recentSignals > 5) {
      warnings.push("High signal frequency detected");
    }

    // Check symbol format
    if (!signal.symbol.match(/^[A-Z]+USDT?$/)) {
      return {
        isValid: false,
        error: "Invalid symbol format",
      };
    }

    // Validate signal price if provided
    if (signal.price && (signal.price <= 0 || signal.price > 1000000)) {
      warnings.push("Signal price seems unusual");
    }

    return {
      isValid: true,
      warnings: warnings.length > 0 ? warnings : undefined,
    };

  } catch (error) {
    console.error("Signal validation error:", error);
    return {
      isValid: false,
      error: "Signal validation failed",
    };
  }
}

// Validate bot configuration before saving - Simplified
export function validateBotConfiguration(botData: SignalBot): SignalValidationResult {
  const warnings: string[] = [];

  // Check portfolio percentage
  if (botData.portfolioPercent > 50) {
    warnings.push("High portfolio percentage (>50%) increases risk");
  }

  if (botData.portfolioPercent < 1) {
    return {
      isValid: false,
      error: "Portfolio percentage must be at least 1%",
    };
  }

  // Check stop loss configuration
  if (!botData.stopLoss || botData.stopLoss > 10) {
    warnings.push("Consider setting a stop loss below 10%");
  }

  // Check take profit configuration
  if (!botData.takeProfit || botData.takeProfit < 1) {
    warnings.push("Consider setting a take profit above 1%");
  }

  // Validate symbols configuration
  if (botData.symbols.length === 0) {
    return {
      isValid: false,
      error: "At least one trading symbol must be configured",
    };
  }

  if (botData.symbols.length > 10) {
    return {
      isValid: false,
      error: "Maximum 10 trading symbols allowed",
    };
  }

  // Validate leverage settings
  if (botData.leverage && botData.leverage > 10) {
    warnings.push("High leverage (>10x) significantly increases risk");
  }

  if (botData.leverage && botData.leverage < 1) {
    return {
      isValid: false,
      error: "Leverage must be at least 1x",
    };
  }

  // Validate stop loss and take profit relationship
  if (botData.stopLoss && botData.takeProfit && botData.stopLoss >= botData.takeProfit) {
    warnings.push("Stop loss should be lower than take profit for better risk-reward ratio");
  }

  return {
    isValid: true,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

// Check if a signal action is allowed - Simplified for basic functionality
export async function isSignalActionAllowed(botId: string, action: SignalAction, symbol: string): Promise<boolean> {
  const openPositions = await db.botTrade.findMany({
    where: {
      botId,
      symbol,
      status: "Open",
    },
  });

  const hasLongPosition = openPositions.some(p => p.side === "Long");
  const hasShortPosition = openPositions.some(p => p.side === "Short");

  switch (action) {
    case "ENTER_LONG":
      // Can't enter long if already in long position (simple mode)
      return !hasLongPosition;
    
    case "EXIT_LONG":
      // Can only exit if in long position
      return hasLongPosition;
    
    case "ENTER_SHORT":
      // Can't enter short if already in short position (simple mode)
      return !hasShortPosition;
    
    case "EXIT_SHORT":
      // Can only exit if in short position
      return hasShortPosition;
    
    default:
      return false;
  }
}