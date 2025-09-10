import { Decimal } from "@prisma/client/runtime/library";

export interface SignalBot {
  id: string;
  name: string;
  userAccountId: string;
  exchangeId: string;
  symbol: string;
  timeframe: string;
  isActive: boolean;
  
  // Risk Management
  portfolioPercent: number;
  stopLoss: number | null;
  takeProfit: number | null;
  trailingStop: boolean;
  
  // DCA Settings
  dcaEnabled: boolean;
  dcaSteps: number | null;
  dcaStepPercent: number | null;
  
  // Webhook Configuration
  webhookUrl: string | null;
  webhookSecret: string | null;
  
  // Alert Messages
  enterLongMsg: string | null;
  exitLongMsg: string | null;
  enterShortMsg: string | null;
  exitShortMsg: string | null;
  exitAllMsg: string | null;
  
  // Statistics
  totalTrades: number;
  winningTrades: number;
  totalPnl: number;
  
  // Exchange details (populated when needed)
  exchange?: {
    id: string;
    name: string;
    apiKey: string;
    apiSecret: string;
    isActive: boolean;
  };
  
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSignalBotData {
  name: string;
  exchangeId: string;
  symbol: string;
  timeframe?: string;
  portfolioPercent?: number;
  stopLoss?: number | null;
  takeProfit?: number | null;
  trailingStop?: boolean;
  dcaEnabled?: boolean;
  dcaSteps?: number | null;
  dcaStepPercent?: number | null;
  enterLongMsg?: string;
  exitLongMsg?: string;
  enterShortMsg?: string;
  exitShortMsg?: string;
  exitAllMsg?: string;
}

export interface UpdateSignalBotData extends Partial<CreateSignalBotData> {
  isActive?: boolean;
}

export type SignalAction = 
  | "ENTER_LONG"
  | "EXIT_LONG" 
  | "ENTER_SHORT"
  | "EXIT_SHORT"
  | "EXIT_ALL";

export interface Signal {
  id: string;
  botId: string;
  action: SignalAction;
  symbol: string;
  price: number | null;
  message: string | null;
  strategy: string | null;
  timeframe: string | null;
  processed: boolean;
  processedAt: Date | null;
  error: string | null;
  createdAt: Date;
}

export type BotTradeStatus = "Open" | "Closed" | "Canceled";
export type BotTradeType = "Signal" | "DCA" | "StopLoss" | "TakeProfit";

export interface BotTrade {
  id: string;
  botId: string;
  signalId: string | null;
  symbol: string;
  side: "Long" | "Short";
  entryPrice: number;
  quantity: number;
  entryValue: number;
  entryTime: Date;
  status: BotTradeStatus;
  exitPrice: number | null;
  exitTime: Date | null;
  exitValue: number | null;
  profit: number | null;
  profitPercentage: number | null;
  stopLoss: number | null;
  takeProfit: number | null;
  tradeType: BotTradeType;
  parentTradeId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// TradingView webhook payload interface
export interface TradingViewAlert {
  action: string;
  symbol: string;
  price?: number;
  strategy?: string;
  timeframe?: string;
  message?: string;
  time?: string;
  // Custom fields for bot identification
  botName?: string;
  botId?: string;
  secret?: string;
}

// Parsed signal from TradingView alert
export interface ParsedSignal {
  action: SignalAction;
  symbol: string;
  price?: number;
  strategy?: string;
  timeframe?: string;
  message?: string;
  botIdentifier?: string; // Either botName or botId
}

// Signal processing result
export interface SignalProcessingResult {
  success: boolean;
  signalId?: string;
  tradeId?: string;
  error?: string;
  message?: string;
}

// Bot performance metrics
export interface BotPerformanceMetrics {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalPnl: number;
  averageWin: number;
  averageLoss: number;
  profitFactor: number;
  maxDrawdown: number;
  sharpeRatio: number;
}

// Risk management configuration
export interface RiskManagementConfig {
  maxPositionSize: number; // Max percentage of portfolio per trade
  maxDailyTrades: number;
  maxDailyLoss: number;
  stopLossPercentage: number;
  takeProfitPercentage: number;
  trailingStopEnabled: boolean;
  trailingStopPercentage: number;
}

// DCA configuration
export interface DCAConfig {
  enabled: boolean;
  steps: number;
  stepPercentage: number; // Price drop percentage to trigger next DCA
  maxDCASteps: number;
  dcaMultiplier: number; // Multiplier for each DCA step size
}

// Bot execution context
export interface BotExecutionContext {
  bot: SignalBot;
  signal: Signal;
  currentPrice: number;
  portfolioValue: number;
  availableBalance: number;
  openPositions: BotTrade[];
  riskConfig: RiskManagementConfig;
}
