/**
 * Signal Bot Zod Schemas
 * 
 * Comprehensive validation schemas for Signal Bot feature.
 * Handles bot configuration, signal processing, margin calculations, and performance tracking.
 */

import { z } from "zod";
import {
    AccountType,
    MarginType,
    SideEffectType,
    Action,
} from "@prisma/client";

// ============================================================================
// INPUT SCHEMAS (for validation)
// ============================================================================

/**
 * Schema for creating a signal bot
 */
export const CreateBotInputSchema = z.object({
    // General Configuration
    name: z.string().min(1, "Bot name is required").max(50, "Name too long"),
    description: z.string().max(200, "Description too long").optional(),
    exchangeId: z.string().uuid("Invalid exchange ID"),
    symbols: z
        .array(z.string().regex(/^[A-Z0-9]+USDT?$/, "Invalid symbol format"))
        .min(1, "At least one symbol required")
        .max(20, "Maximum 20 symbols"),

    // Trading Settings
    tradeAmount: z.number().positive("Amount must be positive"),
    tradeAmountType: z.enum(["QUOTE", "BASE"]),
    orderType: z.enum(["Market", "Limit"]),

    // Account Type
    accountType: z.nativeEnum(AccountType),
    marginType: z.nativeEnum(MarginType).optional().nullable(),
    leverage: z.number().min(1, "Min leverage is 1").max(4, "Max leverage is 4"),

    // Margin-Specific Settings
    sideEffectType: z.nativeEnum(SideEffectType),
    autoRepay: z.boolean(),
    maxBorrowPercent: z
        .number()
        .min(1, "Min 1%")
        .max(100, "Max 100%"),

    // Risk Management
    useStopLoss: z.boolean().default(true),
    useTakeProfit: z.boolean().default(true),
    stopLoss: z.number().min(0.1).max(50).nullable().optional(),
    takeProfit: z.number().min(0.1).max(100).nullable().optional(),


    // Position Limits
    maxDailyTrades: z.number().int().positive().max(1000).optional().nullable(),
    maxOpenPositions: z.number().int().positive().max(100).optional().nullable(),
    maxPositionSize: z.number().positive().optional().nullable(),

    // Custom Alert Messages
    enterLongMsg: z.string().max(100).optional().nullable(),
    exitLongMsg: z.string().max(100).optional().nullable(),
    enterShortMsg: z.string().max(100).optional().nullable(),
    exitShortMsg: z.string().max(100).optional().nullable(),

    // For admin creating bot for customer
    userId: z.string().optional(),
});

/**
 * Schema for updating a signal bot
 */
export const UpdateBotInputSchema = CreateBotInputSchema.partial().extend({
    id: z.string().uuid("Invalid bot ID"),
    isActive: z.boolean().optional(),
});

/**
 * Schema for deleting a bot
 */
export const DeleteBotInputSchema = z.object({
    id: z.string().uuid("Invalid bot ID"),
});

/**
 * Schema for toggling bot active status
 */
export const ToggleBotInputSchema = z.object({
    id: z.string().uuid("Invalid bot ID"),
    isActive: z.boolean(),
});

/**
 * Schema for creating a signal
 */
export const CreateSignalInputSchema = z.object({
    botId: z.string().uuid("Invalid bot ID"),
    action: z.nativeEnum(Action),
    symbol: z.string().min(1, "Symbol is required"),
    price: z.number().positive().optional().nullable(),
    message: z.string().optional().nullable(),
});

/**
 * Schema for deleting a signal
 */
export const DeleteSignalInputSchema = z.object({
    id: z.string().uuid("Invalid signal ID"),
});

/**
 * Schema for processing a signal (webhook)
 */
export const ProcessSignalInputSchema = z.object({
    botId: z.string().uuid("Invalid bot ID"),
    secret: z.string().min(8, "Invalid webhook secret"),
    action: z.string(), // Will be converted to Action enum
    symbol: z.string(),
    price: z.number().positive().optional(),
    message: z.string().optional(),
});

/**
 * Schema for CSV signal upload
 */
export const UploadSignalsCSVInputSchema = z.object({
    botId: z.string().uuid("Invalid bot ID"),
    csvData: z.array(z.object({
        action: z.string(),
        symbol: z.string(),
        price: z.number().optional(),
    })),
});

/**
 * Schema for getting bots with filters
 */
export const GetBotsInputSchema = z.object({
    isActive: z.boolean().optional(),
    accountType: z.nativeEnum(AccountType).optional(),
    userId: z.string().optional(), // For admin use
});

/**
 * Schema for getting signals
 */
export const GetSignalsInputSchema = z.object({
    botId: z.string().uuid().optional(),
    processed: z.boolean().optional(),
    limit: z.number().int().positive().max(1000).optional(),
});

/**
 * Schema for trade validation input
 */
export const ValidateTradeInputSchema = z.object({
    symbol: z.string().min(1, "Symbol is required"),
    tradeAmount: z.number().positive("Amount must be positive"),
    tradeAmountType: z.enum(["QUOTE", "BASE"]),
    exchangeId: z.string().uuid("Invalid exchange ID"),
});

/**
 * Schema for bulk signal creation
 */
export const CreateBulkSignalsInputSchema = z.object({
    userId: z.string().uuid("Invalid user ID"),
    signals: z.array(z.object({
        botId: z.string().uuid(),
        action: z.nativeEnum(Action),
        symbol: z.string().min(1),
        price: z.number().positive().nullable().optional(),
        message: z.string().nullable().optional(),
    })).min(1),
});

/**
 * Schema for manual position creation
 */
export const CreatePositionInputSchema = z.object({
    botId: z.string().uuid("Invalid bot ID"),
    side: z.enum(["Long", "Short"]),
    symbol: z.string().min(1),
    customQuantity: z.number().positive().optional(),
});

// ============================================================================
// OUTPUT SCHEMAS (for response validation)
// ============================================================================

/**
 * Bot schema (server-side with Date objects)
 */
export const BotSchema = z.object({
    id: z.string().uuid(),
    portfolioId: z.string().uuid(),
    exchangeId: z.string().uuid(),
    name: z.string(),
    description: z.string().nullable(),
    isActive: z.boolean(),

    // Trading settings
    symbols: z.array(z.string()),
    tradeAmount: z.number(),
    tradeAmountType: z.string(),
    orderType: z.string(),

    // Account type
    accountType: z.nativeEnum(AccountType),
    marginType: z.nativeEnum(MarginType).nullable(),
    leverage: z.number(),

    // Margin settings
    sideEffectType: z.nativeEnum(SideEffectType),
    autoRepay: z.boolean(),
    maxBorrowPercent: z.number(),

    // Risk management
    useStopLoss: z.boolean(),
    useTakeProfit: z.boolean(),
    stopLoss: z.number().nullable(),
    takeProfit: z.number().nullable(),

    // Limits
    maxDailyTrades: z.number().nullable(),
    maxOpenPositions: z.number().nullable(),
    maxPositionSize: z.number().nullable(),

    // Custom messages
    enterLongMsg: z.string().nullable(),
    exitLongMsg: z.string().nullable(),
    enterShortMsg: z.string().nullable(),
    exitShortMsg: z.string().nullable(),

    // Webhook
    webhookSecret: z.string(),
    webhookUrl: z.string().nullable(),

    // Statistics
    totalTrades: z.number(),
    winTrades: z.number(),
    lossTrades: z.number(),
    totalPnl: z.number(),
    totalVolume: z.number(),
    totalBorrowed: z.number(),
    totalInterest: z.number(),

    // Performance
    lastTradeAt: z.date().nullable(),
    bestTradeReturn: z.number(),
    worstTradeReturn: z.number(),

    // Timestamps
    createdAt: z.date(),
    updatedAt: z.date(),
});

/**
 * Client-safe bot schema
 */
export const BotClientSchema = BotSchema.extend({
    lastTradeAt: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),

    // Calculated fields
    winRate: z.number(), // Percentage
    averagePnl: z.number(),
    profitFactor: z.number(), // Total wins / Total losses
});

/**
 * Bot with exchange info
 */
export const BotWithExchangeSchema = BotClientSchema.extend({
    exchange: z.object({
        id: z.string().uuid(),
        name: z.string(),
        spotValue: z.number().optional().nullable(),
        marginValue: z.number().optional().nullable(),
        totalValue: z.number().optional().nullable(),
    }),
});

/**
 * Signal schema
 */
export const SignalSchema = z.object({
    id: z.string().uuid(),
    botId: z.string().uuid(),
    action: z.nativeEnum(Action),
    symbol: z.string(),
    price: z.number().nullable(),
    message: z.string().nullable(),
    processed: z.boolean(),
    processedAt: z.date().nullable(),
    error: z.string().nullable(),
    visibleToCustomer: z.boolean(),
    positionId: z.string().nullable(),
    ordersFilled: z.number(),
    createdAt: z.date(),
    updatedAt: z.date(),
});

/**
 * Client-safe signal schema
 */
export const SignalClientSchema = SignalSchema.extend({
    processedAt: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
});

/**
 * Get bots result
 */
export const GetBotsResultSchema = z.object({
    bots: z.array(BotWithExchangeSchema),
    total: z.number(),
});

/**
 * Get bot result
 */
export const GetBotResultSchema = z.object({
    bot: BotWithExchangeSchema.nullable(),
});

/**
 * Get signals result
 */
export const GetSignalsResultSchema = z.object({
    signals: z.array(SignalClientSchema),
    total: z.number(),
});

/**
 * Trade validation result schema
 */
export const ValidateTradeResultSchema = z.object({
    valid: z.boolean(),
    formattedQuantity: z.number().optional(),
    formattedAmountType: z.literal("BASE").optional(),
    constraints: z.object({
        minQty: z.number(),
        maxQty: z.number(),
        stepSize: z.number(),
        minNotional: z.number(),
    }).optional(),
    currentPrice: z.number().optional(),
    notionalValue: z.number().optional(),
    errors: z.array(z.string()).optional(),
    warnings: z.array(z.string()).optional(),
});

/**
 * Bulk signal creation result schema
 */
export const CreateBulkSignalsResultSchema = z.object({
    success: z.boolean(),
    created: z.number(),
    failed: z.number(),
    errors: z.array(z.object({
        row: z.number(),
        error: z.string(),
    })),
});

/**
 * Position creation result schema
 */
export const CreatePositionResultSchema = z.object({
    success: z.boolean(),
    message: z.string().optional(),
    position: z.object({
        id: z.string(),
        symbol: z.string(),
        side: z.string(),
        entryPrice: z.number(),
        quantity: z.number(),
        entryValue: z.number(),
        stopLoss: z.number().nullable(),
        takeProfit: z.number().nullable(),
        status: z.string(),
        entryTime: z.date(),
    }).optional(),
    error: z.string().optional(),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

// Input types
export type CreateBotInput = z.infer<typeof CreateBotInputSchema>;
export type UpdateBotInput = z.infer<typeof UpdateBotInputSchema>;
export type DeleteBotInput = z.infer<typeof DeleteBotInputSchema>;
export type ToggleBotInput = z.infer<typeof ToggleBotInputSchema>;
export type CreateSignalInput = z.infer<typeof CreateSignalInputSchema>;
export type ProcessSignalInput = z.infer<typeof ProcessSignalInputSchema>;
export type UploadSignalsCSVInput = z.infer<typeof UploadSignalsCSVInputSchema>;
export type GetBotsInput = z.infer<typeof GetBotsInputSchema>;
export type GetSignalsInput = z.infer<typeof GetSignalsInputSchema>;
export type ValidateTradeInput = z.infer<typeof ValidateTradeInputSchema>;
export type DeleteSignalInput = z.infer<typeof DeleteSignalInputSchema>;

// Output types
export type Bot = z.infer<typeof BotSchema>;
export type BotClient = z.infer<typeof BotClientSchema>;
export type BotWithExchange = z.infer<typeof BotWithExchangeSchema>;
export type Signal = z.infer<typeof SignalSchema>;
export type SignalClient = z.infer<typeof SignalClientSchema>;
export type GetBotsResult = z.infer<typeof GetBotsResultSchema>;
export type GetBotResult = z.infer<typeof GetBotResultSchema>;
export type GetSignalsResult = z.infer<typeof GetSignalsResultSchema>;
export type ValidateTradeResult = z.infer<typeof ValidateTradeResultSchema>;
export type CreateBulkSignalsResult = z.infer<typeof CreateBulkSignalsResultSchema>;
export type CreateBulkSignalsInput = z.infer<typeof CreateBulkSignalsInputSchema>;
export type CreatePositionInput = z.infer<typeof CreatePositionInputSchema>;
export type CreatePositionResult = z.infer<typeof CreatePositionResultSchema>;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Convert server bot to client-safe format with calculations
 */
export function toBotClient(bot: Bot): BotClient {
    // Calculate win rate
    const winRate = bot.totalTrades > 0
        ? (bot.winTrades / bot.totalTrades) * 100
        : 0;

    // Calculate average PnL
    const averagePnl = bot.totalTrades > 0
        ? bot.totalPnl / bot.totalTrades
        : 0;

    // Calculate profit factor
    const totalGains = bot.winTrades > 0 ? (bot.totalPnl > 0 ? bot.totalPnl : 0) : 0;
    const totalLosses = bot.lossTrades > 0 ? Math.abs(bot.totalPnl < 0 ? bot.totalPnl : 0) : 0;
    const profitFactor = totalLosses > 0 ? totalGains / totalLosses : totalGains > 0 ? Infinity : 0;

    return {
        ...bot,
        lastTradeAt: bot.lastTradeAt?.toISOString() ?? null,
        createdAt: bot.createdAt.toISOString(),
        updatedAt: bot.updatedAt.toISOString(),
        winRate,
        averagePnl,
        profitFactor,
    };
}

/**
 * Add exchange info to bot
 */
export function enrichBotWithExchange(
    bot: BotClient,
    exchange: { id: string; name: string }
): BotWithExchange {
    return {
        ...bot,
        exchange,
    };
}

/**
 * Convert server signal to client-safe format
 */
export function toSignalClient(signal: Signal): SignalClient {
    return {
        ...signal,
        processedAt: signal.processedAt?.toISOString() ?? null,
        createdAt: signal.createdAt.toISOString(),
        updatedAt: signal.updatedAt.toISOString(),
    };
}

/**
 * Parse action string to Action enum
 */
export function parseAction(action: string): Action | null {
    // Handle both hyphens and underscores, and convert to uppercase
    const actionNormalized = action.toUpperCase().replace(/[-\s]+/g, "_");

    const actionMap: Record<string, Action> = {
        ENTER_LONG: "ENTER_LONG",
        LONG: "ENTER_LONG",
        BUY: "ENTER_LONG",
        EXIT_LONG: "EXIT_LONG",
        CLOSE_LONG: "EXIT_LONG",
        SELL: "EXIT_LONG",
        ENTER_SHORT: "ENTER_SHORT",
        SHORT: "ENTER_SHORT",
        EXIT_SHORT: "EXIT_SHORT",
        CLOSE_SHORT: "EXIT_SHORT",
        COVER: "EXIT_SHORT",
    };

    return actionMap[actionNormalized] || null;
}

/**
 * Parse a custom string signal format
 * Format: ACTION_EXCHANGE_SYMBOL_MESSAGE_SECRET
 * Example: ENTER-LONG_BINANCE_BTCFDUSD_Sample _4M_e267d336-a8a5-4c4b-96ee-8b71983d30d3
 */
export function parseCustomSignal(signalStr: string): {
    action: string | null;
    symbol: string | null;
    message: string | null;
    secret: string | null;
} | null {
    if (!signalStr || typeof signalStr !== "string") return null;

    // The format seems to be underscore delimited
    // ENTER-LONG _ BINANCE _ BTCFDUSD _ Sample _4M _ e267d336-a8a5-4c4b-96ee-8b71983d30d3
    // However, the message might contain underscores itself. 
    // Usually, these are ACTION_EXCHANGE_SYMBOL_MESSAGE_SECRET

    const parts = signalStr.split("_");

    // We expect at least 4 parts: Action, Exchange, Symbol, Secret
    // If there's more, the middle parts are likely the message
    if (parts.length < 4) return null;

    const action = parts[0];
    // parts[1] is exchange (e.g., BINANCE), we don't strictly need it if botId is in URL
    const symbol = parts[2];
    const secret = parts[parts.length - 1];

    // Message is everything between symbol and secret
    const message = parts.slice(3, -1).join("_").trim();

    return {
        action,
        symbol,
        message: message || "Signal received via custom string",
        secret
    };
}

/**
 * Calculate maximum borrowable amount based on bot settings
 */
export function calculateMaxBorrow(
    collateral: number,
    maxBorrowPercent: number,
    leverage: number
): number {
    // Maximum borrow is based on collateral and max borrow percentage
    const maxBorrowFromCollateral = (collateral * maxBorrowPercent) / 100;

    // Also consider leverage - total position can be collateral * leverage
    const maxPositionSize = collateral * leverage;
    const maxBorrowFromLeverage = maxPositionSize - collateral;

    // Return the minimum of the two to be safe
    return Math.min(maxBorrowFromCollateral, maxBorrowFromLeverage);
}

/**
 * Calculate trade amount based on bot configuration
 */
export function calculateTradeAmount(
    bot: BotClient,
    currentPrice: number,
    availableBalance: number
): { baseQuantity: number; quoteValue: number } {
    if (bot.tradeAmountType === "QUOTE") {
        // Fixed USDT amount
        const quoteValue = Math.min(bot.tradeAmount, availableBalance);
        const baseQuantity = quoteValue / currentPrice;
        return { baseQuantity, quoteValue };
    } else {
        // Fixed BASE amount (e.g., BTC)
        const baseQuantity = bot.tradeAmount;
        const quoteValue = baseQuantity * currentPrice;
        return { baseQuantity, quoteValue };
    }
}

/**
 * Validate if bot can execute trade
 */
export function validateBotCanTrade(
    bot: BotClient,
    currentOpenPositions: number,
    todayTradeCount: number
): { canTrade: boolean; reason?: string } {
    if (!bot.isActive) {
        return { canTrade: false, reason: "Bot is not active" };
    }

    if (bot.maxOpenPositions && currentOpenPositions >= bot.maxOpenPositions) {
        return {
            canTrade: false,
            reason: `Maximum open positions reached (${bot.maxOpenPositions})`,
        };
    }

    if (bot.maxDailyTrades && todayTradeCount >= bot.maxDailyTrades) {
        return {
            canTrade: false,
            reason: `Daily trade limit reached (${bot.maxDailyTrades})`,
        };
    }

    return { canTrade: true };
}
