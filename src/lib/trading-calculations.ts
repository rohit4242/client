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
 * Calculates quantity based on percentage with lot size step compliance
 */
export function calculatePercentageQuantityWithStepSize(
  maxQuantity: number,
  percentage: number,
  symbolInfo: SymbolInfo | null
): number {
  if (maxQuantity <= 0 || percentage <= 0) return 0;
  
  const baseQuantity = maxQuantity * (percentage / 100);
  
  if (!symbolInfo) return baseQuantity;
  
  // Apply lot size validation to ensure step size compliance
  const validation = validateLotSizeFilter(baseQuantity, symbolInfo);
  return validation.adjustedQuantity;
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
 * Validates and adjusts quantity based on exchange lot size filters
 */
export function validateLotSizeFilter(
  quantity: number,
  symbolInfo: SymbolInfo | null
): LotSizeValidationResult {
  const adjustments: string[] = [];
  let adjustedQuantity = quantity;

  if (!symbolInfo || !symbolInfo.filters) {
    return {
      adjustedQuantity,
      isValid: true,
      adjustments,
    };
  }

  // Find the LOT_SIZE filter
  const lotSizeFilter = symbolInfo.filters.find(
    (f) => f.filterType === "LOT_SIZE"
  );

  if (!lotSizeFilter) {
    return {
      adjustedQuantity,
      isValid: true,
      adjustments,
    };
  }

  const minQty = parseFloat(lotSizeFilter.minQty || "0");
  const maxQty = parseFloat(lotSizeFilter.maxQty || "999999999");
  const stepSize = parseFloat(lotSizeFilter.stepSize || "1");

  // Validate input quantity
  if (isNaN(adjustedQuantity) || adjustedQuantity <= 0) {
    return {
      adjustedQuantity: 0,
      isValid: false,
      adjustments,
      error: "Invalid quantity: must be a positive number",
    };
  }

  // Check minimum quantity
  if (adjustedQuantity < minQty) {
    adjustments.push(
      `Quantity ${adjustedQuantity} adjusted to minimum ${minQty}`
    );
    adjustedQuantity = minQty;
  }

  // Check maximum quantity
  if (adjustedQuantity > maxQty) {
    adjustments.push(
      `Quantity ${adjustedQuantity} adjusted to maximum ${maxQty}`
    );
    adjustedQuantity = maxQty;
  }

  // Check step size compliance
  if (stepSize > 0) {
    const adjustedFromMin = adjustedQuantity - minQty;
    const remainder = adjustedFromMin % stepSize;

    // Use a small epsilon for floating point comparison
    if (Math.abs(remainder) > 1e-8) {
      const steps = Math.round(adjustedFromMin / stepSize);
      const newQuantity = minQty + steps * stepSize;
      
      // Format to proper precision to avoid floating point errors
      const decimalPlaces = Math.max(
        (stepSize.toString().split('.')[1] || '').length,
        (minQty.toString().split('.')[1] || '').length
      );
      const formattedQuantity = parseFloat(newQuantity.toFixed(decimalPlaces));
      
      adjustments.push(
        `Quantity ${adjustedQuantity} adjusted to ${formattedQuantity} for step size compliance (step: ${stepSize})`
      );
      
      // Ensure the new quantity is still within bounds
      adjustedQuantity = Math.max(minQty, Math.min(maxQty, formattedQuantity));
    }
  }

  // Final precision formatting to ensure clean numbers
  const finalDecimalPlaces = Math.max(
    (stepSize > 0 ? (stepSize.toString().split('.')[1] || '').length : 0),
    (minQty.toString().split('.')[1] || '').length
  );
  const finalAdjustedQuantity = parseFloat(adjustedQuantity.toFixed(Math.max(finalDecimalPlaces, 8)));

  return {
    adjustedQuantity: finalAdjustedQuantity,
    isValid: finalAdjustedQuantity > 0,
    adjustments,
  };
}

/**
 * Validates and adjusts quantity based on exchange notional filters
 */
export function validateNotionalFilter(
  quantity: number,
  price: number,
  symbolInfo: SymbolInfo | null,
  orderType: 'MARKET' | 'LIMIT' = 'LIMIT'
): NotionalValidationResult {
  const adjustments: string[] = [];
  let adjustedQuantity = quantity;

  if (!symbolInfo || !symbolInfo.filters || !price || price <= 0) {
    return {
      adjustedQuantity,
      isValid: true,
      adjustments,
    };
  }

  // Find the NOTIONAL filter
  const notionalFilter = symbolInfo.filters.find(
    (f) => f.filterType === "NOTIONAL"
  );

  if (!notionalFilter) {
    return {
      adjustedQuantity,
      isValid: true,
      adjustments,
    };
  }

  


  const minNotional = parseFloat(String(notionalFilter.minNotional || "0"));
  const maxNotional = parseFloat(String(notionalFilter.maxNotional || "999999999"));
  const applyMinToMarket = notionalFilter.applyMinToMarket === true;
  const applyMaxToMarket = notionalFilter.applyMaxToMarket === true;

  // Validate input quantity
  if (isNaN(adjustedQuantity) || adjustedQuantity <= 0) {
    return {
      adjustedQuantity: 0,
      isValid: false,
      adjustments,
      error: "Invalid quantity: must be a positive number",
    };
  }

  // Calculate current notional value
  let currentNotional = adjustedQuantity * price;

  // Check if notional filters apply to this order type
  const shouldApplyMin = orderType === 'LIMIT' || (orderType === 'MARKET' && applyMinToMarket);
  const shouldApplyMax = orderType === 'LIMIT' || (orderType === 'MARKET' && applyMaxToMarket);

  // Check minimum notional
  if (shouldApplyMin && currentNotional < minNotional) {
    const requiredQuantity = parseFloat((minNotional / price).toFixed(8));
    adjustments.push(
      `Quantity ${adjustedQuantity} adjusted to ${requiredQuantity} to meet minimum notional ${minNotional} (was ${currentNotional.toFixed(8)})`
    );
    adjustedQuantity = requiredQuantity;
    currentNotional = adjustedQuantity * price;
  }

  // Check maximum notional
  if (shouldApplyMax && currentNotional > maxNotional) {
    const maxAllowedQuantity = parseFloat((maxNotional / price).toFixed(8));
    adjustments.push(
      `Quantity ${adjustedQuantity} adjusted to ${maxAllowedQuantity} to meet maximum notional ${maxNotional} (was ${currentNotional.toFixed(8)})`
    );
    adjustedQuantity = maxAllowedQuantity;
  }

  // Final precision formatting to ensure clean numbers
  const finalAdjustedQuantity = parseFloat(adjustedQuantity.toFixed(8));

  return {
    adjustedQuantity: finalAdjustedQuantity,
    isValid: finalAdjustedQuantity > 0,
    adjustments,
  };
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
 * Lot size filter interface for exchange validation
 */
export interface LotSizeFilter {
  filterType: string;
  minQty: string;
  maxQty: string;
  stepSize: string;
}

/**
 * Symbol filter interface
 */
export interface SymbolFilter {
  filterType: string;
  minQty?: string;
  maxQty?: string;
  stepSize?: string;
  [key: string]: string | number | boolean | undefined;
}

/**
 * Symbol info interface
 */
export interface SymbolInfo {
  symbol: string;
  filters?: SymbolFilter[];
}

/**
 * Lot size validation result
 */
export interface LotSizeValidationResult {
  adjustedQuantity: number;
  isValid: boolean;
  adjustments: string[];
  error?: string;
}

/**
 * Notional validation result
 */
export interface NotionalValidationResult {
  adjustedQuantity: number;
  isValid: boolean;
  adjustments: string[];
  error?: string;
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
