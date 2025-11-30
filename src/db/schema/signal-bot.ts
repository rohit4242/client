import { z } from "zod";

// Signal Bot Configuration Schema (Simplified - No Alert Messages)
export const createSignalBotSchema = z.object({
  // General Configuration
  name: z.string().min(1, "Bot name is required").max(50, "Bot name must be less than 50 characters"),
  description: z.string().max(200, "Description must be less than 200 characters").optional(),
  exchangeId: z.string().uuid("Invalid exchange ID"),
  symbols: z.array(z.string().regex(/^[A-Z]+USDT?$/, "Invalid symbol format")).min(1, "At least one symbol is required").max(10, "Maximum 10 symbols allowed").default([]),
  
  // Entry Settings
  orderType: z.enum(["Market", "Limit"]).default("Market"),
  
  // Trading Amount (Fixed amount instead of percentage)
  tradeAmount: z.number().positive("Amount must be positive"),
  tradeAmountType: z.enum(["QUOTE", "BASE"]).default("QUOTE"), // QUOTE = USDT, BASE = BTC
  leverage: z.number().min(1).max(10).default(1),
  
  // Account Type - Spot or Margin
  accountType: z.enum(["SPOT", "MARGIN"]).default("SPOT"),
  marginType: z.enum(["CROSS"]).default("CROSS").optional(),
  sideEffectType: z.enum(["NO_SIDE_EFFECT", "MARGIN_BUY", "AUTO_REPAY", "AUTO_BORROW_REPAY"]).default("NO_SIDE_EFFECT"),
  autoRepay: z.boolean().default(false),
  maxBorrowPercent: z.number().min(1).max(100).default(50),
  
  // Risk Management
  stopLoss: z.number().min(0.1).max(50).nullable().optional(),
  takeProfit: z.number().min(0.1).max(100).nullable().optional(),
});

export const updateSignalBotSchema = createSignalBotSchema.partial().extend({
  isActive: z.boolean().optional(),
});

// Signal Action Schema - Standard 4 actions
export const signalActionSchema = z.enum([
  "ENTER_LONG",
  "EXIT_LONG", 
  "ENTER_SHORT",
  "EXIT_SHORT"
]);

// TradingView Alert Schema (supports both JSON and plain text parsed)
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

// Bot Trade Schema
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
  secret: z.string().min(8, "Webhook secret must be at least 8 characters").optional(),
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

// Account Type Options
export const ACCOUNT_TYPE_OPTIONS = [
  { label: "Spot Trading", value: "SPOT" },
  { label: "Margin Trading", value: "MARGIN" },
] as const;

// Side Effect Type Options (for margin trading)
export const SIDE_EFFECT_TYPE_OPTIONS = [
  { label: "No Side Effect", value: "NO_SIDE_EFFECT", description: "Normal order without auto-borrow/repay" },
  { label: "Margin Buy", value: "MARGIN_BUY", description: "Auto-borrow if balance insufficient" },
  { label: "Auto Repay", value: "AUTO_REPAY", description: "Auto-repay debt when selling" },
  { label: "Auto Borrow & Repay", value: "AUTO_BORROW_REPAY", description: "Automatically borrow and repay as needed" },
] as const;

// Trade Amount Type Options
export const TRADE_AMOUNT_TYPE_OPTIONS = [
  { label: "Quote Currency", value: "QUOTE", example: "USDT" },
  { label: "Base Currency", value: "BASE", example: "BTC" },
] as const;

// Popular trading symbols for signal bots
export const SIGNAL_BOT_SYMBOLS = [
  "BTCUSDT",
  "BTCFUSDT",
  "ETHUSDT", 
  "ETHFUSDT",
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
