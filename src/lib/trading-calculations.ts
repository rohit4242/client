// Trading calculation utilities for precise financial calculations

import { AssetBalance, AssetPrice } from "@/types/trading";

/**
 * Formats a number to appropriate decimal places for trading
 */
export function formatTradingQuantity(value: number): string {
  if (value === 0) return "0";

  if (value >= 1) {
    // For values >= 1, show up to 4 decimal places
    return parseFloat(value.toFixed(4)).toString();
  } else {
    // For values < 1, show up to 8 decimal places
    return parseFloat(value.toFixed(8)).toString();
  }
}

/**
 * Formats currency values with proper precision
 */
export function formatCurrency(value: number, decimals: number = 2): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Calculates the maximum available quantity for trading
 */
export function calculateMaxQuantity(balance: AssetBalance | null): number {
  if (!balance) return 0;
  return parseFloat(balance.free);
}

/**
 * Calculates quantity based on percentage of available balance
 */
export function calculatePercentageQuantity(
  maxQuantity: number,
  percentage: number
): number {
  if (maxQuantity <= 0 || percentage <= 0) return 0;
  return maxQuantity * (percentage / 100);
}

/**
 * Calculates the estimated cost/value of a trade
 */
export function calculateEstimatedCost(
  quantity: string | number,
  price: AssetPrice | null
): number {
  if (!price || !quantity) return 0;

  const quantityNum =
    typeof quantity === "string" ? parseFloat(quantity) : quantity;
  const priceNum = parseFloat(price.price);

  if (
    isNaN(quantityNum) ||
    isNaN(priceNum) ||
    quantityNum <= 0 ||
    priceNum <= 0
  ) {
    return 0;
  }

  return quantityNum * priceNum;
}

/**
 * Validates if a quantity is within available balance
 */
export function validateQuantity(
  quantity: string | number,
  maxQuantity: number
): { isValid: boolean; error?: string } {
  const quantityNum =
    typeof quantity === "string" ? parseFloat(quantity) : quantity;

  if (isNaN(quantityNum)) {
    return { isValid: false, error: "Invalid quantity format" };
  }

  if (quantityNum <= 0) {
    return { isValid: false, error: "Quantity must be greater than 0" };
  }

  if (quantityNum > maxQuantity) {
    return { isValid: false, error: "Insufficient balance" };
  }

  return { isValid: true };
}

/**
 * Calculates trading fees (placeholder for future implementation)
 */
export function calculateTradingFee(
  cost: number,
  feeRate: number = 0.001 // 0.1% default fee
): number {
  return cost * feeRate;
}

/**
 * Calculates total cost including fees
 */
export function calculateTotalCost(
  cost: number,
  feeRate?: number
): { cost: number; fee: number; total: number } {
  const fee = calculateTradingFee(cost, feeRate);
  return {
    cost,
    fee,
    total: cost + fee,
  };
}

/**
 * Comprehensive trade calculation
 */
export interface TradeCalculation {
  quantity: number;
  formattedQuantity: string;
  estimatedCost: number;
  formattedCost: string;
  fee: number;
  total: number;
  isValid: boolean;
  error?: string;
}

export function calculateTrade(
  quantity: string | number,
  price: AssetPrice | null,
  maxQuantity: number,
  feeRate?: number
): TradeCalculation {
  const quantityNum =
    typeof quantity === "string" ? parseFloat(quantity) : quantity;
  const validation = validateQuantity(quantityNum, maxQuantity);

  if (!validation.isValid) {
    return {
      quantity: 0,
      formattedQuantity: "0",
      estimatedCost: 0,
      formattedCost: "$0.00",
      fee: 0,
      total: 0,
      isValid: false,
      error: validation.error,
    };
  }

  const estimatedCost = calculateEstimatedCost(quantityNum, price);
  const { fee, total } = calculateTotalCost(estimatedCost, feeRate);

  return {
    quantity: quantityNum,
    formattedQuantity: formatTradingQuantity(quantityNum),
    estimatedCost,
    formattedCost: `$${formatCurrency(estimatedCost)}`,
    fee,
    total,
    isValid: true,
  };
}
