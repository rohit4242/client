import { z } from "zod";

// Signal Bot Configuration Schema
export const createSignalBotSchema = z.object({
  name: z.string().min(1, "Bot name is required").max(50, "Bot name must be less than 50 characters"),
  exchangeId: z.string().uuid("Invalid exchange ID"),
  symbol: z.string().min(1, "Symbol is required").regex(/^[A-Z]+USDT?$/, "Invalid symbol format"),
  timeframe: z.string().default("5m"),
  portfolioPercent: z.number().min(1, "Portfolio percentage must be at least 1%").max(100, "Portfolio percentage cannot exceed 100%").default(20),
  stopLoss: z.number().min(0.1).max(50).nullable().optional(),
  takeProfit: z.number().min(0.1).max(100).nullable().optional(),
  trailingStop: z.boolean().default(false),
  dcaEnabled: z.boolean().default(false),
  dcaSteps: z.number().min(2).max(10).nullable().optional(),
  dcaStepPercent: z.number().min(0.5).max(10).nullable().optional(),
  enterLongMsg: z.string().max(100).optional(),
  exitLongMsg: z.string().max(100).optional(),
  enterShortMsg: z.string().max(100).optional(),
  exitShortMsg: z.string().max(100).optional(),
  exitAllMsg: z.string().max(100).optional(),
});

export const updateSignalBotSchema = createSignalBotSchema.partial().extend({
  isActive: z.boolean().optional(),
});

// Signal Action Schema
export const signalActionSchema = z.enum([
  "ENTER_LONG",
  "EXIT_LONG", 
  "ENTER_SHORT",
  "EXIT_SHORT",
  "EXIT_ALL"
]);

// TradingView Alert Schema
export const tradingViewAlertSchema = z.object({
  action: z.string(),
  symbol: z.string(),
  price: z.number().positive().optional(),
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
  message: z.string().optional(),
  strategy: z.string().optional(),
  timeframe: z.string().optional(),
});

// Bot Trade Schema
export const botTradeStatusSchema = z.enum(["Open", "Closed", "Canceled"]);
export const botTradeTypeSchema = z.enum(["Signal", "DCA", "StopLoss", "TakeProfit"]);

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
  tradeType: botTradeTypeSchema.default("Signal"),
  parentTradeId: z.string().uuid().nullable().optional(),
});

// Webhook Validation Schema
export const webhookValidationSchema = z.object({
  botId: z.string().uuid().optional(),
  secret: z.string().min(8, "Webhook secret must be at least 8 characters"),
});

// Risk Management Schema
export const riskManagementSchema = z.object({
  maxPositionSize: z.number().min(1).max(100),
  maxDailyTrades: z.number().min(1).max(100),
  maxDailyLoss: z.number().min(1).max(50),
  stopLossPercentage: z.number().min(0.1).max(50),
  takeProfitPercentage: z.number().min(0.1).max(100),
  trailingStopEnabled: z.boolean(),
  trailingStopPercentage: z.number().min(0.1).max(20),
});

// DCA Configuration Schema
export const dcaConfigSchema = z.object({
  enabled: z.boolean(),
  steps: z.number().min(2).max(10),
  stepPercentage: z.number().min(0.5).max(10),
  maxDCASteps: z.number().min(2).max(10),
  dcaMultiplier: z.number().min(1).max(5),
});

// Type exports
export type CreateSignalBotData = z.infer<typeof createSignalBotSchema>;
export type UpdateSignalBotData = z.infer<typeof updateSignalBotSchema>;
export type SignalActionType = z.infer<typeof signalActionSchema>;
export type TradingViewAlertData = z.infer<typeof tradingViewAlertSchema>;
export type CreateSignalData = z.infer<typeof createSignalSchema>;
export type BotTradeStatusType = z.infer<typeof botTradeStatusSchema>;
export type BotTradeTypeType = z.infer<typeof botTradeTypeSchema>;
export type CreateBotTradeData = z.infer<typeof createBotTradeSchema>;
export type RiskManagementConfig = z.infer<typeof riskManagementSchema>;
export type DCAConfig = z.infer<typeof dcaConfigSchema>;

// Default configurations
export const DEFAULT_RISK_CONFIG: RiskManagementConfig = {
  maxPositionSize: 20,
  maxDailyTrades: 10,
  maxDailyLoss: 5,
  stopLossPercentage: 2,
  takeProfitPercentage: 4,
  trailingStopEnabled: false,
  trailingStopPercentage: 1,
};

export const DEFAULT_DCA_CONFIG: DCAConfig = {
  enabled: false,
  steps: 3,
  stepPercentage: 2,
  maxDCASteps: 5,
  dcaMultiplier: 1.5,
};

// Timeframe options
export const TIMEFRAME_OPTIONS = [
  { label: "1 minute", value: "1m" },
  { label: "3 minutes", value: "3m" },
  { label: "5 minutes", value: "5m" },
  { label: "15 minutes", value: "15m" },
  { label: "30 minutes", value: "30m" },
  { label: "1 hour", value: "1h" },
  { label: "2 hours", value: "2h" },
  { label: "4 hours", value: "4h" },
  { label: "6 hours", value: "6h" },
  { label: "8 hours", value: "8h" },
  { label: "12 hours", value: "12h" },
  { label: "1 day", value: "1d" },
  { label: "3 days", value: "3d" },
  { label: "1 week", value: "1w" },
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
