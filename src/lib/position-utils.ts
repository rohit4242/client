import { PositionData, PositionCalculations, PriceData } from "@/types/position";

/**
 * Calculate position metrics including P&L, percentages, and values
 */
export function calculatePositionMetrics(
  position: PositionData, 
  currentPrice?: number
): PositionCalculations {
  const price = currentPrice || position.currentPrice;
  const entryPrice = position.entryPrice;
  const quantity = position.quantity;
  
  // Calculate unrealized P&L
  let unrealizedPnl = 0;
  if (position.side === "Long") {
    unrealizedPnl = (price - entryPrice) * quantity;
  } else {
    unrealizedPnl = (entryPrice - price) * quantity;
  }
  
  // Calculate unrealized P&L percentage
  const unrealizedPnlPercent = ((price - entryPrice) / entryPrice) * 100 * (position.side === "Long" ? 1 : -1);
  
  // Calculate total value
  const totalValue = price * quantity;
  
  // Calculate average entry price (if multiple entries)
  const averageEntryPrice = entryPrice; // Simplified for now
  
  // Calculate break-even price (including fees)
  const totalFees = position.fees || 0;
  const breakEvenPrice = position.side === "Long" 
    ? entryPrice + (totalFees / quantity)
    : entryPrice - (totalFees / quantity);
  
  // Calculate liquidation price (for leveraged positions)
  const liquidationPrice = position.side === "Long" 
    ? entryPrice * 0.8 // Simplified calculation
    : entryPrice * 1.2;
  
  // Calculate margin and leverage (if applicable)
  const margin = totalValue * 0.1; // Simplified 10% margin
  const leverage = totalValue / margin;
  
  return {
    unrealizedPnl,
    unrealizedPnlPercent,
    totalValue,
    averageEntryPrice,
    breakEvenPrice,
    liquidationPrice,
    margin,
    leverage
  };
}

/**
 * Format currency values with proper formatting
 */
export function formatCurrency(value: number, currency = "USD"): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format percentage values with proper sign and formatting
 */
export function formatPercentage(value: number, decimals = 2): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(decimals)}%`;
}

/**
 * Get color class for P&L values
 */
export function getPnLColor(value: number): string {
  if (value > 0) return "text-green-600";
  if (value < 0) return "text-red-600";
  return "text-gray-600";
}

/**
 * Calculate position risk level based on various factors
 */
export function calculateRiskLevel(position: PositionData): "LOW" | "MEDIUM" | "HIGH" {
  const portfolioRisk = position.portfolioPercent / 100;
  const drawdownRisk = Math.abs(position.maxDrawdown) / 100;
  
  let riskScore = 0;
  
  // Portfolio allocation risk
  if (portfolioRisk > 0.5) riskScore += 3;
  else if (portfolioRisk > 0.2) riskScore += 2;
  else riskScore += 1;
  
  // Drawdown risk
  if (drawdownRisk > 0.1) riskScore += 3;
  else if (drawdownRisk > 0.05) riskScore += 2;
  else riskScore += 1;
  
  // No stop loss risk
  if (!position.stopLoss) riskScore += 2;
  
  if (riskScore >= 7) return "HIGH";
  if (riskScore >= 4) return "MEDIUM";
  return "LOW";
}

/**
 * Determine the opposite order side for closing positions
 */
export function getOppositeOrderSide(positionSide: "Long" | "Short"): "BUY" | "SELL" {
  return positionSide === "Long" ? "SELL" : "BUY";
}

/**
 * Calculate slippage-adjusted price
 */
export function calculateSlippagePrice(
  currentPrice: number, 
  side: "BUY" | "SELL", 
  slippagePercent: number
): number {
  const slippageMultiplier = side === "SELL" 
    ? (1 - slippagePercent / 100) // For sells, accept lower prices
    : (1 + slippagePercent / 100); // For buys, accept higher prices
  
  return currentPrice * slippageMultiplier;
}

/**
 * Calculate trading fees
 */
export function calculateTradingFees(
  volume: number, 
  feeRate = 0.001 // Default 0.1% fee
): number {
  return volume * feeRate;
}

/**
 * Check if position should be automatically closed based on risk parameters
 */
export function shouldAutoClose(position: PositionData, currentPrice: number): {
  shouldClose: boolean;
  reason?: string;
} {
  const calculations = calculatePositionMetrics(position, currentPrice);
  
  // Check stop loss
  if (position.stopLoss) {
    const hitStopLoss = position.side === "Long" 
      ? currentPrice <= position.stopLoss
      : currentPrice >= position.stopLoss;
    
    if (hitStopLoss) {
      return { shouldClose: true, reason: "Stop loss triggered" };
    }
  }
  
  // Check take profit
  if (position.takeProfit) {
    const hitTakeProfit = position.side === "Long"
      ? currentPrice >= position.takeProfit
      : currentPrice <= position.takeProfit;
    
    if (hitTakeProfit) {
      return { shouldClose: true, reason: "Take profit triggered" };
    }
  }
  
  // Check maximum drawdown
  if (Math.abs(calculations.unrealizedPnlPercent) > 50) { // 50% max drawdown
    return { shouldClose: true, reason: "Maximum drawdown exceeded" };
  }
  
  return { shouldClose: false };
}

/**
 * Generate a unique order ID
 */
export function generateOrderId(prefix = "order"): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return `${prefix}_${timestamp}_${random}`;
}

/**
 * Validate position data
 */
export function validatePositionData(position: Partial<PositionData>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!position.id) errors.push("Position ID is required");
  if (!position.symbol) errors.push("Symbol is required");
  if (!position.side) errors.push("Position side is required");
  if (!position.entryPrice || position.entryPrice <= 0) errors.push("Valid entry price is required");
  if (!position.quantity || position.quantity <= 0) errors.push("Valid quantity is required");
  if (!position.exchange) errors.push("Exchange is required");
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Sort positions by various criteria
 */
export function sortPositions<T extends PositionData>(
  positions: T[],
  sortBy: keyof T,
  direction: "asc" | "desc" = "desc"
): T[] {
  return [...positions].sort((a, b) => {
    const aValue = a[sortBy];
    const bValue = b[sortBy];
    
    if (aValue === bValue) return 0;
    
    let result = 0;
    if (typeof aValue === "number" && typeof bValue === "number") {
      result = aValue - bValue;
    } else if (aValue instanceof Date && bValue instanceof Date) {
      result = aValue.getTime() - bValue.getTime();
    } else {
      result = String(aValue).localeCompare(String(bValue));
    }
    
    return direction === "asc" ? result : -result;
  });
}

/**
 * Filter positions based on criteria
 */
export function filterPositions(
  positions: PositionData[],
  filters: {
    symbol?: string;
    exchange?: string;
    side?: "Long" | "Short";
    status?: string;
    minValue?: number;
    maxValue?: number;
    hasStopLoss?: boolean;
    hasTakeProfit?: boolean;
  }
): PositionData[] {
  return positions.filter(position => {
    if (filters.symbol && position.symbol !== filters.symbol) return false;
    if (filters.exchange && position.exchange !== filters.exchange) return false;
    if (filters.side && position.side !== filters.side) return false;
    if (filters.status && position.status !== filters.status) return false;
    
    const totalValue = position.currentPrice * position.quantity;
    if (filters.minValue && totalValue < filters.minValue) return false;
    if (filters.maxValue && totalValue > filters.maxValue) return false;
    
    if (filters.hasStopLoss !== undefined) {
      const hasStopLoss = position.stopLoss !== undefined && position.stopLoss !== null;
      if (filters.hasStopLoss !== hasStopLoss) return false;
    }
    
    if (filters.hasTakeProfit !== undefined) {
      const hasTakeProfit = position.takeProfit !== undefined && position.takeProfit !== null;
      if (filters.hasTakeProfit !== hasTakeProfit) return false;
    }
    
    return true;
  });
}
