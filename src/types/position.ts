import { Exchange } from "./exchange";

// Database-aligned types (matching Prisma schema)
export type PositionSide = "LONG" | "SHORT";
export type PositionStatus = "OPEN" | "CLOSED" | "CANCELED" | "MARKET_CLOSED" | "FAILED";
export type PositionType = "MARKET" | "LIMIT";
export type PositionSource = "MANUAL" | "BOT";

// Order types (matching Prisma schema)
export type OrderType = "ENTRY" | "EXIT";
export type OrderSide = "BUY" | "SELL";
export type OrderOrderType = "MARKET" | "LIMIT";
export type OrderStatus = "NEW" | "PENDING" | "FILLED" | "COMPLETED" | "CANCELED" | "REJECTED" | "PARTIALLY_FILLED";

// UI-friendly types for display
export type PositionSideDisplay = "Long" | "Short";
export type PositionStatusDisplay = "ENTERED" | "OPEN" | "CLOSED" | "CANCELED" | "MARKET_CLOSED" | "FAILED" | "PENDING" | "PARTIALLY_FILLED";

// Database position order (matching Prisma schema)
export interface DatabasePositionOrder {
  id: string;
  positionId: string;
  userAccountId: string;
  orderId: string; // External order ID from exchange
  symbol: string;
  type: OrderType; // ENTRY, EXIT
  side: OrderSide; // BUY, SELL
  orderType: OrderOrderType; // MARKET, LIMIT
  price: number;
  quantity: number;
  value: number; // Total value (price * quantity)
  status: OrderStatus;
  fillPercent: number; // Fill percentage (0-100)
  pnl: number;
  details?: string;
  createdAt: Date;
  updatedAt: Date;
}

// UI-friendly position order interface
export interface PositionOrder {
  id: string;
  type: OrderType;
  side: OrderSide;
  price: number;
  amount: number; // Same as quantity
  filled: number; // Calculated from fillPercent
  remaining: number; // quantity - filled
  createdAt: Date;
  lastUpdatedAt: Date;
  status: OrderStatus;
  fill: number; // Fill percentage (0-100)
  volume: number; // Volume in USD (same as value)
  pnl: number;
  fees?: number;
  averagePrice?: number;
}

export interface PositionStrategy {
  id: string;
  name: string;
  description?: string;
}

export interface PositionAccount {
  id: string;
  name: string;
  exchange: Exchange;
  accountType: string;
}

// Database position (matching Prisma schema)
export interface DatabasePosition {
  id: string;
  userAccountId: string;
  symbol: string;
  side: PositionSide; // LONG, SHORT
  type: PositionType; // MARKET, LIMIT
  entryPrice: number;
  quantity: number;
  entryValue: number;
  currentPrice?: number;
  status: PositionStatus;
  exitPrice?: number;
  exitValue?: number;
  pnl: number;
  pnlPercent: number;
  stopLoss?: number;
  takeProfit?: number;
  source: PositionSource; // MANUAL, BOT
  botId?: string;
  strategyId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// UI-friendly position interface
export interface PositionData {
  id: string;
  symbol: string;
  side: PositionSideDisplay; // "Long", "Short" for UI
  entryPrice: number;
  currentPrice: number;
  exitPrice?: number; // Exit price for closed positions
  quantity: number;
  filledQuantity: number;
  remainingQuantity: number;
  
  // Risk Management
  maxDrawdown: number;
  takeProfit?: number;
  stopLoss?: number;
  breakEven?: number;
  trailing?: number;
  
  // Portfolio & Performance
  portfolioPercent: number;
  pnlPercent: number;
  roiPercent: number;
  unrealizedPnl: number;
  realizedPnl: number;
  
  // Status & Timing
  status: PositionStatusDisplay; // UI-friendly status
  entryTime: Date;
  exitTime?: Date;
  lastUpdated: Date;
  
  // Exchange & Strategy Info
  exchange: string;
  strategy: PositionStrategy;
  account: PositionAccount;
  
  // Orders
  orders: PositionOrder[];
  
  // Calculated Fields
  totalVolume: number;
  profitLoss: number;
  fees: number;
  
  // Additional Metadata
  tags?: string[];
  notes?: string;
  riskLevel?: "LOW" | "MEDIUM" | "HIGH";
}

export interface PositionFilters {
  exchange?: string;
  symbol?: string;
  status?: PositionStatusDisplay; // Use display status for UI filtering
  side?: PositionSideDisplay;
  strategy?: string;
  dateRange?: {
    from: Date;
    to: Date;
  };
}

export interface PositionSummary {
  totalPositions: number;
  openPositions: number;
  closedPositions: number;
  totalVolume: number;
  totalPnl: number;
  totalFees: number;
  winRate: number;
  avgHoldTime: number;
}

// Market Close Request
export interface MarketCloseRequest {
  positionId: string;
  closeType: "FULL" | "PARTIAL";
  quantity?: number; // For partial close
  price?: number; // For limit close orders
  slippage?: number; // Max allowed slippage percentage
}

// Market Close Response
export interface MarketCloseResponse {
  success: boolean;
  orderId?: string;
  executedPrice?: number;
  executedQuantity?: number;
  remainingQuantity?: number;
  fees?: number;
  message?: string;
  error?: string;
}

// Position Action Types
export type PositionAction = 
  | { type: "CLOSE_POSITION"; payload: MarketCloseRequest }
  | { type: "UPDATE_STOP_LOSS"; payload: { positionId: string; stopLoss: number } }
  | { type: "UPDATE_TAKE_PROFIT"; payload: { positionId: string; takeProfit: number } }
  | { type: "UPDATE_TRAILING"; payload: { positionId: string; trailing: number } }
  | { type: "ADD_TO_POSITION"; payload: { positionId: string; quantity: number } }
  | { type: "REDUCE_POSITION"; payload: { positionId: string; quantity: number } };

// Component Props Types
export interface PositionTableProps {
  positions: PositionData[];
  loading?: boolean;
  onPositionAction?: (action: PositionAction) => Promise<void>;
  onRefresh?: () => void;
  filters?: PositionFilters;
  onFiltersChange?: (filters: PositionFilters) => void;
}

export interface PositionRowProps {
  position: PositionData;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  onPositionAction?: (action: PositionAction) => Promise<void>;
  currentPrice?: number;
}

export interface PositionActionsProps {
  position: PositionData;
  onAction: (action: PositionAction) => Promise<void>;
  disabled?: boolean;
}

export interface OrderHistoryProps {
  orders: PositionOrder[];
  loading?: boolean;
}

// Utility Types
export type PositionCalculations = {
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
  totalValue: number;
  averageEntryPrice: number;
  breakEvenPrice: number;
  liquidationPrice?: number;
  margin?: number;
  leverage?: number;
};

export type PriceData = {
  symbol: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  volume24h: number;
  lastUpdated: Date;
};

// Transformation utilities
export interface PositionTransformContext {
  currentPrices?: Record<string, number>;
  exchangeInfo?: Record<string, unknown>;
  portfolio?: {
    id: string;
    name: string;
    exchanges: Array<{
      id: string;
      name: string;
      portfolioId: string;
    }>;
  };
}

// API Response types
export interface PositionApiResponse {
  success: boolean;
  data: PositionData[];
  count: number;
  message?: string;
  error?: string;
}

export interface ClosePositionApiResponse {
  success: boolean;
  message?: string;
  position?: {
    id: string;
    status: PositionStatus;
    pnl: number;
    pnlPercent: number;
  };
  closeOrder?: {
    orderId: string;
    executedPrice: number;
    executedQuantity: number;
    fees: number;
  };
  error?: string;
}

// Helper types for position management
export interface PositionUpdate {
  positionId: string;
  updates: Partial<DatabasePosition>;
}

export interface OrderUpdate {
  orderId: string;
  updates: Partial<DatabasePositionOrder>;
}
