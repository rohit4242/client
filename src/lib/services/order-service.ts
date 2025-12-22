/**
 * Order Execution Service
 * Main orchestrator for order flow - used by both manual trading and signal bot
 */

import { type ExchangeClient } from "@/features/exchange";
import { placeSpotOrder } from "./exchange/binance-spot";
import { placeMarginOrder } from "./exchange/binance-margin";
import { toBinanceConfig, SpotOrderParams, MarginOrderParams } from "./exchange/types";
import {
  createPosition,
  updatePositionWithExecution,
  deletePosition,
} from "./position-service";
import { getPriceBySymbol } from "@/lib/trading-utils";
import { recalculatePortfolioStatsInternal } from "@/db/actions/portfolio/recalculate-stats";

// Minimal exchange interface for order execution (only requires trading essentials)
export interface TradingExchangeInfo {
  id: string;
  name: string;
  apiKey: string;
  apiSecret: string;
  portfolioId?: string;
}

export interface OrderRequest {
  userId: string;
  portfolioId: string;
  exchange: TradingExchangeInfo;
  accountType: "spot" | "margin";
  order: {
    symbol: string;
    side: "BUY" | "SELL";
    type: "MARKET" | "LIMIT";
    quantity?: string;
    quoteOrderQty?: string;
    price?: string;
    timeInForce?: "GTC" | "IOC" | "FOK";
    sideEffectType?: "NO_SIDE_EFFECT" | "MARGIN_BUY" | "AUTO_REPAY";
  };
  source?: "MANUAL" | "SIGNAL_BOT";
}

export interface OrderResult {
  success: boolean;
  positionId?: string;
  orderId?: string;
  executedQty?: number;
  executedPrice?: number;
  error?: string;
  code?: number;
}

/**
 * Execute an order - main entry point for all order execution
 * Handles both spot and margin orders
 * Can be called from manual trading UI or signal bot
 * 
 * @param request - Order request parameters
 * @returns Order execution result
 */
export async function executeOrder(
  request: OrderRequest
): Promise<OrderResult> {
  console.log("[Order Service] Executing order:", request);

  try {
    const config = toBinanceConfig(request.exchange);

    // Step 1: Get current price
    const currentPriceData = await getPriceBySymbol(
      config,
      request.order.symbol
    );
    const currentPrice = parseFloat(currentPriceData.price);

    // Step 2: Calculate position quantity
    let positionQuantity = parseFloat(request.order.quantity || "0");
    if (
      positionQuantity === 0 &&
      request.order.type === "MARKET" &&
      request.order.quoteOrderQty
    ) {
      // For market orders with quoteOrderQty, estimate quantity from current price
      positionQuantity =
        parseFloat(request.order.quoteOrderQty) / currentPrice;
    }

    // Step 3: Create position in database
    const positionResult = await createPosition({
      portfolioId: request.portfolioId,
      symbol: request.order.symbol,
      side: request.order.side === "BUY" ? "LONG" : "SHORT",
      type: request.order.type === "MARKET" ? "MARKET" : "LIMIT",
      entryPrice: currentPrice,
      quantity: positionQuantity,
      accountType: request.accountType === "spot" ? "SPOT" : "MARGIN",
      sideEffectType: request.order.sideEffectType || "NO_SIDE_EFFECT",
      source: request.source || "MANUAL",
    });

    if (!positionResult.success || !positionResult.positionId || !positionResult.orderId) {
      return {
        success: false,
        error: positionResult.error || "Failed to create position",
      };
    }

    const { positionId, orderId } = positionResult;

    // Step 4: Execute order on Binance
    let exchangeResult;

    if (request.accountType === "spot") {
      // Execute spot order
      const spotParams: SpotOrderParams = {
        symbol: request.order.symbol,
        side: request.order.side,
        type: request.order.type,
        quantity: request.order.quantity,
        quoteOrderQty: request.order.quoteOrderQty,
        price: request.order.price,
        timeInForce: request.order.timeInForce,
      };
      exchangeResult = await placeSpotOrder(config, spotParams);
    } else {
      // Execute margin order
      const marginParams: MarginOrderParams = {
        symbol: request.order.symbol,
        side: request.order.side,
        type: request.order.type,
        quantity: request.order.quantity,
        quoteOrderQty: request.order.quoteOrderQty,
        price: request.order.price,
        timeInForce: request.order.timeInForce,
        sideEffectType: request.order.sideEffectType,
      };
      exchangeResult = await placeMarginOrder(config, marginParams);
    }

    // Step 5: Handle exchange result
    if (!exchangeResult.success || !exchangeResult.data) {
      // Order failed on exchange - clean up position
      console.log("[Order Service] Order failed on exchange, cleaning up position");
      await deletePosition(positionId, orderId);

      return {
        success: false,
        error: exchangeResult.error || "Order failed on exchange",
        code: exchangeResult.code,
      };
    }

    // Step 6: Update position with execution data
    const updateResult = await updatePositionWithExecution(
      positionId,
      orderId,
      exchangeResult.data
    );

    if (!updateResult.success) {
      console.error("[Order Service] Failed to update position:", updateResult.error);
      // Order was placed but update failed - don't fail the whole operation
      // The order is on Binance and position is in DB, just with old data
    }

    // Step 7: Recalculate portfolio stats
    try {
      await recalculatePortfolioStatsInternal(request.userId);
    } catch (statsError) {
      console.error("[Order Service] Failed to update portfolio stats:", statsError);
      // Don't fail the order if stats update fails
    }

    // Step 8: Return success result
    const executedQty = parseFloat(exchangeResult.data.executedQty || "0");
    const cummulativeQuoteQty = parseFloat(
      exchangeResult.data.cummulativeQuoteQty || "0"
    );
    const executedPrice =
      executedQty > 0 ? cummulativeQuoteQty / executedQty : currentPrice;

    console.log("[Order Service] Order executed successfully:", {
      positionId,
      orderId,
      executedQty,
      executedPrice,
    });

    return {
      success: true,
      positionId,
      orderId,
      executedQty,
      executedPrice,
    };
  } catch (error: unknown) {
    console.error("[Order Service] Error executing order:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Failed to execute order";

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Validate order request before execution
 * @param request - Order request to validate
 * @returns Validation result
 */
export function validateOrderRequest(
  request: OrderRequest
): { isValid: boolean; error?: string } {
  // Basic validation
  if (!request.portfolioId) {
    return { isValid: false, error: "Portfolio ID is required" };
  }

  if (!request.exchange?.apiKey || !request.exchange?.apiSecret) {
    return { isValid: false, error: "Exchange API credentials are required" };
  }

  if (!request.order.symbol) {
    return { isValid: false, error: "Symbol is required" };
  }

  if (!["BUY", "SELL"].includes(request.order.side)) {
    return { isValid: false, error: "Invalid order side" };
  }

  if (!["MARKET", "LIMIT"].includes(request.order.type)) {
    return { isValid: false, error: "Invalid order type" };
  }

  // Validate quantity/quoteOrderQty
  if (request.order.type === "MARKET") {
    if (!request.order.quantity && !request.order.quoteOrderQty) {
      return {
        isValid: false,
        error: "Either quantity or quoteOrderQty is required for market orders",
      };
    }
  } else if (request.order.type === "LIMIT") {
    if (!request.order.quantity || !request.order.price) {
      return {
        isValid: false,
        error: "Quantity and price are required for limit orders",
      };
    }
  }

  return { isValid: true };
}

