import { Action } from "@prisma/client";
import type { Bot, Exchange, Portfolio, Signal } from "@prisma/client";
import { getPriceBySymbol, tradingPairInfo } from "../trading-utils";
import {
  getSymbolConstraints,
  validateAndFormatOrderQuantity,
  validateBalance,
} from "./exchange-info-utils";

/**
 * Parse result interface
 */
export interface ParseResult {
  success: boolean;
  data?: {
    action: Action;
    exchange: string;
    symbol: string;
    botName: string;
    timeframe: string;
    botId: string;
  };
  error?: string;
}

/**
 * Validation result interface
 */
export interface ValidationResult {
  success: boolean;
  errors: string[];
}

/**
 * Parse TradingView alert message
 *
 * Expected format: "ACTION_EXCHANGE_SYMBOL_BOTNAME_TIMEFRAME_BOTID"
 * Example: "ENTER-LONG_BINANCE_BTCUSDT_BOT-NAME-TV8BuH_5M_afdfe842b36b842f4ab2a95"
 *
 * Parsed as:
 * - Part 0: action (ENTER-LONG, EXIT-LONG, ENTER-SHORT, EXIT-SHORT)
 * - Part 1: exchange (BINANCE)
 * - Part 2: symbol (BTCUSDT)
 * - Part 3: botName (BOT-NAME-TV8BuH)
 * - Part 4: timeframe (5M, 15M, 1H, etc.)
 * - Part 5: botId (UUID or identifier)
 */
export function parseTradingViewAlert(alertMessage: string): ParseResult {
  if (!alertMessage || typeof alertMessage !== "string") {
    return {
      success: false,
      error: "Alert message is required and must be a string",
    };
  }

  // Split by underscore
  const parts = alertMessage.trim().split("_");

  if (parts.length < 6) {
    return {
      success: false,
      error: `Invalid alert format. Expected 6 parts separated by underscore, got ${parts.length}. Format: ACTION_EXCHANGE_SYMBOL_BOTNAME_TIMEFRAME_BOTID`,
    };
  }

  const actionStr = parts[0]?.toUpperCase(); // e.g., "ENTER-LONG"
  const exchange = parts[1]?.toUpperCase(); // e.g., "BINANCE"
  const symbol = parts[2]?.toUpperCase(); // e.g., "BTCUSDT"
  const botName = parts[3]; // e.g., "BOT-NAME-TV8BuH"
  const timeframe = parts[4]; // e.g., "5M"
  const botId = parts[5]; // e.g., "afdfe842b36b842f4ab2a95"

  // Map action string to Prisma Action enum
  const actionMap: Record<string, Action> = {
    "ENTER-LONG": Action.ENTER_LONG,
    ENTERLONG: Action.ENTER_LONG,
    ENTER_LONG: Action.ENTER_LONG,

    "EXIT-LONG": Action.EXIT_LONG,
    EXITLONG: Action.EXIT_LONG,
    EXIT_LONG: Action.EXIT_LONG,

    "ENTER-SHORT": Action.ENTER_SHORT,
    ENTERSHORT: Action.ENTER_SHORT,
    ENTER_SHORT: Action.ENTER_SHORT,

    "EXIT-SHORT": Action.EXIT_SHORT,
    EXITSHORT: Action.EXIT_SHORT,
    EXIT_SHORT: Action.EXIT_SHORT,
  };

  const action = actionMap[actionStr];

  if (!action) {
    return {
      success: false,
      error: `Invalid action: "${actionStr}". Supported actions: ENTER-LONG, EXIT-LONG, ENTER-SHORT, EXIT-SHORT`,
    };
  }

  if (!exchange) {
    return {
      success: false,
      error: "Exchange is required in alert message (part 2)",
    };
  }

  if (!symbol) {
    return {
      success: false,
      error: "Symbol is required in alert message (part 3)",
    };
  }

  // Validate symbol format (basic check)
  if (!/^[A-Z0-9]+$/.test(symbol)) {
    return {
      success: false,
      error: `Invalid symbol format: "${symbol}". Symbol must contain only uppercase letters and numbers`,
    };
  }

  if (!botName) {
    return {
      success: false,
      error: "Bot name is required in alert message (part 4)",
    };
  }

  if (!timeframe) {
    return {
      success: false,
      error: "Timeframe is required in alert message (part 5)",
    };
  }

  if (!botId) {
    return {
      success: false,
      error: "Bot ID is required in alert message (part 6)",
    };
  }

  // Basic validation for bot ID (should not be empty or whitespace)
  if (botId.trim().length === 0) {
    return {
      success: false,
      error: "Bot ID cannot be empty",
    };
  }

  return {
    success: true,
    data: {
      action,
      exchange,
      symbol,
      botName,
      timeframe,
      botId: botId.trim(),
    },
  };
}

/**
 * Validate webhook payload against bot configuration
 */
export function validateWebhookPayload(
  bot: Bot & { exchange?: { isActive: boolean } },
  symbol: string,
  action: Action
): ValidationResult {
  const errors: string[] = [];

  // Check if bot is active
  if (!bot.isActive) {
    errors.push("Bot is not active");
  }

  // Check if symbol is in bot's allowed symbols
  if (bot.symbols.length > 0 && !bot.symbols.includes(symbol)) {
    errors.push(
      `Symbol ${symbol} is not configured for this bot. Configured symbols: ${bot.symbols.join(
        ", "
      )}`
    );
  }

  // Check if exchange is configured and active
  if (bot.exchange && !bot.exchange.isActive) {
    errors.push("Bot's exchange is not active");
  }

  // Validate action
  const validActions: Action[] = [
    Action.ENTER_LONG,
    Action.EXIT_LONG,
    Action.ENTER_SHORT,
    Action.EXIT_SHORT,
  ];

  if (!validActions.includes(action)) {
    errors.push(`Invalid action: ${action}`);
  }

  return {
    success: errors.length === 0,
    errors,
  };
}

/**
 * Validate position parameters
 */
export function validatePositionParams(params: {
  quantity: number;
  entryPrice: number;
  stopLoss?: number | null;
  takeProfit?: number | null;
  side: "LONG" | "SHORT";
}): ValidationResult {
  const errors: string[] = [];

  // Validate quantity
  if (params.quantity <= 0) {
    errors.push("Quantity must be greater than 0");
  }

  if (isNaN(params.quantity) || !isFinite(params.quantity)) {
    errors.push("Quantity must be a valid number");
  }

  // Validate entry price
  if (params.entryPrice <= 0) {
    errors.push("Entry price must be greater than 0");
  }

  if (isNaN(params.entryPrice) || !isFinite(params.entryPrice)) {
    errors.push("Entry price must be a valid number");
  }

  // Validate stop loss
  if (params.stopLoss !== null && params.stopLoss !== undefined) {
    if (params.stopLoss <= 0) {
      errors.push("Stop loss must be greater than 0");
    }

    // For LONG: stop loss should be below entry price
    if (params.side === "LONG" && params.stopLoss >= params.entryPrice) {
      errors.push("Stop loss must be below entry price for LONG positions");
    }

    // For SHORT: stop loss should be above entry price
    if (params.side === "SHORT" && params.stopLoss <= params.entryPrice) {
      errors.push("Stop loss must be above entry price for SHORT positions");
    }
  }

  // Validate take profit
  if (params.takeProfit !== null && params.takeProfit !== undefined) {
    if (params.takeProfit <= 0) {
      errors.push("Take profit must be greater than 0");
    }

    // For LONG: take profit should be above entry price
    if (params.side === "LONG" && params.takeProfit <= params.entryPrice) {
      errors.push("Take profit must be above entry price for LONG positions");
    }

    // For SHORT: take profit should be below entry price
    if (params.side === "SHORT" && params.takeProfit >= params.entryPrice) {
      errors.push("Take profit must be below entry price for SHORT positions");
    }
  }

  return {
    success: errors.length === 0,
    errors,
  };
}

export async function signalValidator(
  bot: Bot,
  signal: Signal,
  exchange: Exchange,
  portfolio: Portfolio
) {
  const errors: string[] = [];

  const configurationRestAPI = {
    apiKey: exchange.apiKey,
    apiSecret: exchange.apiSecret,
  };
  const currentPrice = await getPriceBySymbol(
    configurationRestAPI,
    signal.symbol
  );

  const getSymbolConstraintsResult = await getSymbolConstraints(
    configurationRestAPI,
    signal.symbol
  );
  if (!getSymbolConstraintsResult) {
    errors.push("Unable to get trading constraints for symbol");
    return {
      success: false,
      errors,
    };
  }

  const validateAndFormatOrderQuantityResult = validateAndFormatOrderQuantity(
    bot.tradeAmount,
    parseFloat(currentPrice.price),
    getSymbolConstraintsResult
  );
  if (!validateAndFormatOrderQuantityResult.valid) {
    errors.push("Invalid quantity or price");
    return {
      success: false,
      errors: [
        validateAndFormatOrderQuantityResult.error ||
          "Invalid quantity or price",
      ],
    };
  }

  const validatedQuantity =
    validateAndFormatOrderQuantityResult.formattedQuantity;
  if (validatedQuantity <= 0) {
    errors.push("Validated quantity must be greater than 0");
    return {
      success: false,
      errors: [
        validateAndFormatOrderQuantityResult.error ||
          "Invalid quantity or price",
      ],
    };
  }

  const validateBalanceResult = validateBalance(
    configurationRestAPI,
    signal.symbol,
    validatedQuantity
  );

  console.log("validatedQuantity: ", validatedQuantity);
  console.log("validateBalanceResult: ", validateBalanceResult);

  return {
    success: true,
    constraints: getSymbolConstraintsResult,
    validatedQuantity,
    validateBalanceResult,
    validated: true,
  };
}
