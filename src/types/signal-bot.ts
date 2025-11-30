export interface SignalBot {
  id: string;
  name: string;
  description?: string | null;
  userAccountId: string;
  exchangeId: string;
  symbols: string[];
  isActive: boolean;
  
  // Entry Settings
  orderType: OrderType;
  
  // Trading Amount (Fixed amount)
  tradeAmount: number;
  tradeAmountType: "QUOTE" | "BASE";
  leverage?: number | null;
  
  // Account Type - Spot or Margin
  accountType: "SPOT" | "MARGIN";
  marginType?: "CROSS" | null;
  sideEffectType: string; // NO_SIDE_EFFECT, MARGIN_BUY, AUTO_REPAY, AUTO_BORROW_REPAY
  autoRepay: boolean;
  maxBorrowPercent: number;
  
  // Risk Management
  stopLoss?: number | null;
  takeProfit?: number | null;
  
  // Webhook Configuration
  webhookUrl: string | null;
  webhookSecret: string | null;
  
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
  
  // Trading Amount (Fixed amount)
  tradeAmount: number;
  tradeAmountType?: "QUOTE" | "BASE";
  leverage?: number;
  
  // Account Type
  accountType?: "SPOT" | "MARGIN";
  marginType?: "CROSS";
  sideEffectType?: string;
  autoRepay?: boolean;
  maxBorrowPercent?: number;
  
  // Risk Management
  stopLoss?: number | null;
  takeProfit?: number | null;
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
  timeframe: string | null;
  visibleToCustomer: boolean;
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
  
  // Risk Management
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

export interface SignalBotWebhookPayload {
  action: SignalAction;
  symbol: string;
  price?: number;
  strategy?: string;
  timeframe?: string;
  message?: string;
  time?: string;
}

// Signal processing result
export interface SignalProcessingResult {
  success: boolean;
  signalId?: string;
  tradeId?: string;
  positionId?: string;
  orderId?: string;
  binanceOrderId?: string;
  error?: string;
  message?: string;
  executionTime?: number;
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
