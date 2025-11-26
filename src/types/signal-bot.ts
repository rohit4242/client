export interface SignalBot {
  id: string;
  name: string;
  description?: string | null;
  userAccountId: string;
  exchangeId: string;
  symbols: string[];
  isActive: boolean;
  
  // Entry Settings - Simple
  orderType: OrderType;
  
  // Amount per Trade - Simplified
  portfolioPercent: number;
  leverage?: number | null;
  
  // Account Type - Spot or Margin
  accountType: "SPOT" | "MARGIN";
  marginType?: "CROSS" | null;
  sideEffectType: string; // NO_SIDE_EFFECT, MARGIN_BUY, AUTO_REPAY, AUTO_BORROW_REPAY
  autoRepay: boolean;
  maxBorrowPercent: number;
  
  // Exit Strategies - Simple
  stopLoss?: number | null;
  takeProfit?: number | null;
  
  // Webhook Configuration
  webhookUrl: string | null;
  webhookSecret: string | null;
  
  // Alert Messages - Simple (4 signals only)
  enterLongMsg: string | null;
  exitLongMsg: string | null;
  enterShortMsg: string | null;
  exitShortMsg: string | null;
  
  // Statistics
  totalTrades: number;
  winTrades: number;
  lossTrades: number;
  totalPnl: number;
  totalVolume: number;
  totalBorrowed: number;
  totalInterest: number;
  
  // Exchange details (populated when needed)
  exchange?: {
    id: string;
    name: string;
    apiKey: string;
    apiSecret: string;
    isActive: boolean;
    spotValue?: number;
    marginValue?: number;
    totalValue?: string;
  };
  
  createdAt: Date;
  updatedAt: Date;
}

export type OrderType = "Market" | "Limit" | "Stop";

export interface CreateSignalBotData {
  name: string;
  description?: string;
  exchangeId: string;
  symbols: string[];
  
  // Entry Settings
  orderType: OrderType;
  
  // Amount per Trade
  portfolioPercent: number;
  leverage?: number;
  
  // Account Type
  accountType?: "SPOT" | "MARGIN";
  marginType?: "CROSS";
  sideEffectType?: string;
  autoRepay?: boolean;
  maxBorrowPercent?: number;
  
  // Exit Strategies
  stopLoss?: number | null;
  takeProfit?: number | null;
  
  // Alert Messages
  enterLongMsg?: string;
  exitLongMsg?: string;
  enterShortMsg?: string;
  exitShortMsg?: string;
}

export interface UpdateSignalBotData extends Partial<CreateSignalBotData> {
  isActive?: boolean;
}

export type SignalAction = 
  | "ENTER_LONG"
  | "EXIT_LONG" 
  | "ENTER_SHORT"
  | "EXIT_SHORT";

export interface Signal {
  id: string;
  botId: string;
  action: SignalAction;
  symbol: string;
  price: number | null;
  quantity?: number | null;
  message: string | null;
  strategy: string | null;
  timeframe: string | null;
  processed: boolean;
  processedAt: Date | null;
  error: string | null;
  createdAt: Date;
}

export type BotTradeStatus = "Open" | "Closed" | "Canceled";

export interface BotTrade {
  id: string;
  botId: string;
  signalId?: string | null;
  symbol: string;
  side: PositionSide;
  entryPrice: number;
  quantity: number;
  entryValue: number;
  entryTime: Date;
  status: BotTradeStatus;
  exitPrice?: number | null;
  exitTime?: Date | null;
  exitValue?: number | null;
  profit?: number | null;
  profitPercentage?: number | null;
  
  // Simple Exit Strategies
  stopLoss?: number | null;
  takeProfit?: number | null;
  
  // Order Details
  orderType: OrderType;
  leverage?: number | null;
  
  createdAt: Date;
  updatedAt: Date;
}

export type PositionSide = "Long" | "Short";

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
}

// Bot execution context
export interface BotExecutionContext {
  bot: SignalBot;
  signal: Signal;
  currentPrice: number;
  portfolioValue: number;
  availableBalance: number;
  openPositions: BotTrade[];
}