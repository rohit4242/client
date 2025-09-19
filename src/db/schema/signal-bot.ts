import { z } from "zod";

// Simple Signal Bot Configuration Schema
export const createSignalBotSchema = z.object({
  // General Configuration
  name: z.string().min(1, "Bot name is required").max(50, "Bot name must be less than 50 characters"),
  description: z.string().max(200, "Description must be less than 200 characters").optional(),
  exchangeId: z.string().uuid("Invalid exchange ID"),
  symbols: z.array(z.string().regex(/^[A-Z]+USDT?$/, "Invalid symbol format")).min(1, "At least one symbol is required").max(10, "Maximum 10 symbols allowed").default([]),
  
  // Entry Settings - Simple
  orderType: z.enum(["Market", "Limit"]).default("Market"),
  
  // Amount per Trade - Simplified
  portfolioPercent: z.number().min(1, "Portfolio percentage must be at least 1%").max(100, "Portfolio percentage cannot exceed 100%").default(20),
  leverage: z.number().min(1).max(125).default(1),
  
  // Exit Strategies - Simple
  stopLoss: z.number().min(0.1).max(50).nullable().optional(),
  takeProfit: z.number().min(0.1).max(100).nullable().optional(),
  
  // Alert Messages - Simple (4 signals only)
  enterLongMsg: z.string().max(100).optional(),
  exitLongMsg: z.string().max(100).optional(),
  enterShortMsg: z.string().max(100).optional(),
  exitShortMsg: z.string().max(100).optional(),
});

export const updateSignalBotSchema = createSignalBotSchema.partial().extend({
  isActive: z.boolean().optional(),
});

// Signal Action Schema - Only 4 actions
export const signalActionSchema = z.enum([
  "ENTER_LONG",
  "EXIT_LONG", 
  "ENTER_SHORT",
  "EXIT_SHORT"
]);

// Simple TradingView Alert Schema
export const tradingViewAlertSchema = z.object({
  action: z.string(),
  symbol: z.string(),
  price: z.number().positive().optional(),
  quantity: z.number().positive().optional(),
  strategy: z.string().optional(),
  timeframe: z.string().optional(),
  message: z.string().optional(),
  time: z.string().optional(),
  botName: z.string().optional(),
  botId: z.string().uuid().optional(),
  secret: z.string().optional(),
});

// Signal Creation Schema
export const createSignalSchema = z.object({
  botId: z.string().uuid(),
  action: signalActionSchema,
  symbol: z.string(),
  price: z.number().positive().nullable().optional(),
  quantity: z.number().positive().nullable().optional(),
  message: z.string().optional(),
  strategy: z.string().optional(),
  timeframe: z.string().optional(),
});

// Bot Trade Schema - Simplified
export const botTradeStatusSchema = z.enum(["Open", "Closed", "Canceled"]);

export const createBotTradeSchema = z.object({
  botId: z.string().uuid(),
  signalId: z.string().uuid().optional(),
  symbol: z.string(),
  side: z.enum(["Long", "Short"]),
  entryPrice: z.number().positive(),
  quantity: z.number().positive(),
  entryValue: z.number().positive(),
  stopLoss: z.number().positive().nullable().optional(),
  takeProfit: z.number().positive().nullable().optional(),
});

// Webhook Validation Schema
export const webhookValidationSchema = z.object({
  botId: z.string().uuid().optional(),
  secret: z.string().min(8, "Webhook secret must be at least 8 characters"),
});

// Type exports
export type CreateSignalBotData = z.infer<typeof createSignalBotSchema>;
export type UpdateSignalBotData = z.infer<typeof updateSignalBotSchema>;
export type SignalActionType = z.infer<typeof signalActionSchema>;
export type TradingViewAlertData = z.infer<typeof tradingViewAlertSchema>;
export type CreateSignalData = z.infer<typeof createSignalSchema>;
export type BotTradeStatusType = z.infer<typeof botTradeStatusSchema>;
export type CreateBotTradeData = z.infer<typeof createBotTradeSchema>;

// Order Type Options
export const ORDER_TYPE_OPTIONS = [
  { label: "Market Order", value: "Market" },
  { label: "Limit Order", value: "Limit" },
] as const;

// Popular trading symbols for signal bots
export const SIGNAL_BOT_SYMBOLS = [
  "BTCUSDT",
  "ETHUSDT", 
  "BNBUSDT",
  "ADAUSDT",
  "XRPUSDT",
  "SOLUSDT",
  "DOTUSDT",
  "DOGEUSDT",
  "AVAXUSDT",
  "MATICUSDT",
  "LINKUSDT",
  "UNIUSDT",
  "LTCUSDT",
  "BCHUSDT",
  "XLMUSDT",
  "FILUSDT",
  "TRXUSDT",
  "ETCUSDT",
  "XMRUSDT",
  "EOSUSDT",
] as const;