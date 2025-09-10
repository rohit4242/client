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

// Validate bot configuration before saving
export function validateBotConfiguration(botData: SignalBot): SignalValidationResult {
  const warnings: string[] = [];

  // Check portfolio percentage
  if (botData.portfolioPercent > 50) {
    warnings.push("High portfolio percentage (>50%) increases risk");
  }

  // Check stop loss configuration
  if (!botData.stopLoss || botData.stopLoss > 10) {
    warnings.push("Consider setting a stop loss below 10%");
  }

  // Check take profit configuration
  if (!botData.takeProfit) {
    warnings.push("Consider setting a take profit target");
  }

  // Validate DCA settings
  if (botData.dcaEnabled) {
    if (!botData.dcaSteps || botData.dcaSteps < 2) {
      return {
        isValid: false,
        error: "DCA steps must be at least 2",
      };
    }

    if (!botData.dcaStepPercent || botData.dcaStepPercent < 0.5) {
      return {
        isValid: false,
        error: "DCA step percentage must be at least 0.5%",
      };
    }

    if (botData.portfolioPercent * botData.dcaSteps > 100) {
      return {
        isValid: false,
        error: "DCA configuration would exceed 100% of portfolio",
      };
    }
  }

  // Validate custom messages
  if (botData.enterLongMsg && botData.enterLongMsg === botData.exitLongMsg) {
    return {
      isValid: false,
      error: "Enter and exit messages cannot be the same",
    };
  }

  return {
    isValid: true,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

// Check if a signal action is allowed based on current positions
export async function isSignalActionAllowed(botId: string, action: SignalAction): Promise<boolean> {
  const openPositions = await db.botTrade.findMany({
    where: {
      botId,
      status: "Open",
    },
  });

  const hasLongPosition = openPositions.some(p => p.side === "Long");
  const hasShortPosition = openPositions.some(p => p.side === "Short");

  switch (action) {
    case "ENTER_LONG":
      return !hasLongPosition; // Can't enter long if already long
    
    case "EXIT_LONG":
      return hasLongPosition; // Can only exit if in long position
    
    case "ENTER_SHORT":
      return !hasShortPosition; // Can't enter short if already short
    
    case "EXIT_SHORT":
      return hasShortPosition; // Can only exit if in short position
    
    case "EXIT_ALL":
      return hasLongPosition || hasShortPosition; // Can exit if any position exists
    
    default:
      return false;
  }
}
