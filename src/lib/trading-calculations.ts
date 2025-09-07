import { AssetBalance, AssetPrice } from "@/types/trading";

/**
 * Calculate the maximum quantity that can be bought with available balance
 */
export function calculateMaxBuyQuantity(
  balance: AssetBalance | null,
  price: AssetPrice | null
): number {
  if (!balance || !price) return 0;
  
  const availableBalance = parseFloat(balance.free);
  const currentPrice = parseFloat(price.price);
  
  if (availableBalance <= 0 || currentPrice <= 0) return 0;
  
  return availableBalance / currentPrice;
}

/**
 * Calculate the maximum quantity that can be sold
 */
export function calculateMaxSellQuantity(balance: AssetBalance | null): number {
  if (!balance) return 0;
  return parseFloat(balance.free);
}

/**
 * Calculate the total cost for a given quantity and price
 */
export function calculateTotalCost(
  quantity: number,
  price: number,
  feeRate: number = 0.001
): {
  cost: number;
  fees: number;
  total: number;
} {
  const cost = quantity * price;
  const fees = cost * feeRate;
  const total = cost + fees;
  
  return { cost, fees, total };
}

/**
 * Calculate quantity based on percentage of available balance
 */
export function calculateQuantityFromPercentage(
  percentage: number,
  balance: AssetBalance | null,
  price: AssetPrice | null,
  side: "BUY" | "SELL"
): number {
  if (!balance || percentage <= 0 || percentage > 100) return 0;
  
  const availableBalance = parseFloat(balance.free);
  const percentageAmount = (availableBalance * percentage) / 100;
  
  if (side === "BUY") {
    if (!price) return 0;
    const currentPrice = parseFloat(price.price);
    return currentPrice > 0 ? percentageAmount / currentPrice : 0;
  } else {
    return percentageAmount;
  }
}

/**
 * Calculate percentage based on quantity and available balance
 */
export function calculatePercentageFromQuantity(
  quantity: number,
  balance: AssetBalance | null,
  price: AssetPrice | null,
  side: "BUY" | "SELL"
): number {
  if (!balance || quantity <= 0) return 0;
  
  const availableBalance = parseFloat(balance.free);
  if (availableBalance <= 0) return 0;
  
  if (side === "BUY") {
    if (!price) return 0;
    const currentPrice = parseFloat(price.price);
    if (currentPrice <= 0) return 0;
    
    const totalCost = quantity * currentPrice;
    return Math.min(100, Math.max(0, (totalCost / availableBalance) * 100));
  } else {
    return Math.min(100, Math.max(0, (quantity / availableBalance) * 100));
  }
}

/**
 * Validate minimum order requirements
 */
export function validateMinimumOrder(
  quantity: number,
  price: number,
  minNotional: number,
  minQty: number
): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (quantity < minQty) {
    errors.push(`Minimum quantity is ${minQty}`);
  }
  
  const totalValue = quantity * price;
  if (totalValue < minNotional) {
    errors.push(`Total order value should be more than ${minNotional} USDT`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Format number with appropriate precision
 */
export function formatTradingNumber(
  value: number,
  type: "quantity" | "price" | "total" = "quantity"
): string {
  if (type === "price") {
    return value < 1 
      ? value.toFixed(8).replace(/\.?0+$/, "") 
      : value.toFixed(2);
  }
  
  if (type === "total") {
    return value.toFixed(2);
  }
  
  // quantity
  return value.toFixed(8).replace(/\.?0+$/, "");
}

/**
 * Check if balance is sufficient for the order
 */
export function checkSufficientBalance(
  quantity: number,
  price: number,
  balance: AssetBalance | null,
  side: "BUY" | "SELL",
  feeRate: number = 0.001
): {
  isSufficient: boolean;
  required: number;
  available: number;
} {
  if (!balance) {
    return { isSufficient: false, required: 0, available: 0 };
  }
  
  const available = parseFloat(balance.free);
  
  if (side === "BUY") {
    const { total } = calculateTotalCost(quantity, price, feeRate);
    return {
      isSufficient: available >= total,
      required: total,
      available,
    };
  } else {
    return {
      isSufficient: available >= quantity,
      required: quantity,
      available,
    };
  }
}
