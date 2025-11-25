/**
 * Balance Validation Service
 * Validates if user has sufficient balance for orders
 */

import { Exchange } from "@/types/exchange";
import { getMaxBorrowable } from "../exchange/binance-margin";
import { toBinanceConfig } from "../exchange/types";

export interface BalanceValidationResult {
  isValid: boolean;
  error?: string;
  requiredAmount?: number;
  availableAmount?: number;
  borrowRequired?: number;
}

/**
 * Validate spot balance for an order
 * @param available - Available balance
 * @param required - Required amount
 * @param asset - Asset symbol
 * @returns Validation result
 */
export function validateSpotBalance(
  available: number,
  required: number,
  asset: string
): BalanceValidationResult {
  if (available >= required) {
    return { isValid: true };
  }

  return {
    isValid: false,
    error: `Insufficient ${asset} balance. Available: ${available.toFixed(8)}, Required: ${required.toFixed(8)}`,
    requiredAmount: required,
    availableAmount: available,
  };
}

/**
 * Validate margin balance with borrowing consideration
 * @param available - Available balance
 * @param required - Required amount
 * @param asset - Asset symbol
 * @param sideEffectType - Margin side effect type
 * @param exchange - Exchange configuration (for checking max borrowable)
 * @returns Validation result
 */
export async function validateMarginBalance(
  available: number,
  required: number,
  asset: string,
  sideEffectType: string,
  exchange: Exchange
): Promise<BalanceValidationResult> {
  // If NO_SIDE_EFFECT, treat like spot (must have full balance)
  if (sideEffectType === "NO_SIDE_EFFECT") {
    return validateSpotBalance(available, required, asset);
  }

  // If MARGIN_BUY, check if borrowing is possible
  if (sideEffectType === "MARGIN_BUY") {
    const borrowRequired = Math.max(0, required - available);

    // If no borrowing needed, order is valid
    if (borrowRequired === 0) {
      return { isValid: true };
    }

    // Check max borrowable amount
    try {
      const config = toBinanceConfig(exchange);
      const maxBorrowableData = await getMaxBorrowable(config, asset);

      if (!maxBorrowableData) {
        return {
          isValid: false,
          error: `Unable to check borrowing limits for ${asset}`,
          requiredAmount: required,
          availableAmount: available,
          borrowRequired,
        };
      }

      const maxBorrowable = maxBorrowableData.amount;

      if (borrowRequired > maxBorrowable) {
        return {
          isValid: false,
          error: `Order exceeds maximum borrowable amount. Required: ${borrowRequired.toFixed(8)} ${asset}, Max borrowable: ${maxBorrowable.toFixed(8)} ${asset}`,
          requiredAmount: required,
          availableAmount: available,
          borrowRequired,
        };
      }

      // Borrowing is possible
      return {
        isValid: true,
        borrowRequired,
      };
    } catch (error) {
      console.error("[Balance Validator] Error checking max borrowable:", error);
      return {
        isValid: false,
        error: `Failed to verify borrowing limits: ${error instanceof Error ? error.message : "Unknown error"}`,
        requiredAmount: required,
        availableAmount: available,
        borrowRequired,
      };
    }
  }

  // AUTO_REPAY: for sell orders, check if we have the asset to sell
  if (sideEffectType === "AUTO_REPAY") {
    return validateSpotBalance(available, required, asset);
  }

  // Unknown side effect type
  return {
    isValid: false,
    error: `Unknown side effect type: ${sideEffectType}`,
  };
}

/**
 * Calculate required amount for an order
 * @param side - Order side (BUY or SELL)
 * @param quantity - Order quantity
 * @param price - Order price
 * @param quoteOrderQty - Quote order quantity (for market buy orders)
 * @returns Required asset and amount
 */
export function calculateRequiredAmount(
  side: "BUY" | "SELL",
  quantity?: string,
  price?: string,
  quoteOrderQty?: string
): {
  asset: "base" | "quote";
  amount: number;
} {
  if (side === "BUY") {
    // For buy orders, we need quote asset (e.g., USDT)
    if (quoteOrderQty && parseFloat(quoteOrderQty) > 0) {
      return {
        asset: "quote",
        amount: parseFloat(quoteOrderQty),
      };
    } else if (quantity && price && parseFloat(quantity) > 0 && parseFloat(price) > 0) {
      return {
        asset: "quote",
        amount: parseFloat(quantity) * parseFloat(price),
      };
    }
  } else {
    // For sell orders, we need base asset (e.g., BTC)
    if (quantity && parseFloat(quantity) > 0) {
      return {
        asset: "base",
        amount: parseFloat(quantity),
      };
    }
  }

  return { asset: "quote", amount: 0 };
}

