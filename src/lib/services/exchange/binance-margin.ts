/**
 * Binance Margin Trading Service
 * Handles margin order execution on Binance
 */

import { MarginTrading } from "@binance/margin-trading";
import { BinanceConfig, MarginOrderParams, BinanceOrderResponse, ExchangeResult } from "./types";

/**
 * Place a margin order on Binance
 * @param config - Binance API configuration
 * @param params - Margin order parameters
 * @returns Exchange result with order response
 */
export async function placeMarginOrder(
  config: BinanceConfig,
  params: MarginOrderParams
): Promise<ExchangeResult> {
  try {
    console.log("[Margin Service] Placing order:", params);

    const client = new MarginTrading({ configurationRestAPI: config });

    // Build order parameters
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orderParams: any = {
      symbol: params.symbol,
      side: params.side,
      type: params.type,
    };

    if (params.quantity) {
      orderParams.quantity = parseFloat(params.quantity);
    }

    if (params.quoteOrderQty) {
      orderParams.quoteOrderQty = parseFloat(params.quoteOrderQty);
    }

    if (params.price) {
      orderParams.price = parseFloat(params.price);
    }

    if (params.sideEffectType) {
      orderParams.sideEffectType = params.sideEffectType;
    }

    if (params.timeInForce) {
      orderParams.timeInForce = params.timeInForce;
    }

    console.log("[Margin Service] Order params:", orderParams);

    // Place the margin order on Binance
    const response = await client.restAPI.marginAccountNewOrder(orderParams);
    const data = await response.data();

    console.log("[Margin Service] Order placed successfully:", data);

    return {
      success: true,
      data: data as BinanceOrderResponse,
    };
  } catch (error: unknown) {
    console.error("[Margin Service] Error placing order:", error);

    // Handle Binance API errors
    if (
      error &&
      typeof error === "object" &&
      "response" in error &&
      error.response &&
      typeof error.response === "object" &&
      "data" in error.response
    ) {
      const binanceError = (
        error.response as { data: { msg?: string; code?: number } }
      ).data;
      return {
        success: false,
        error: binanceError.msg || "Unknown Binance error",
        code: binanceError.code,
      };
    }

    // Handle network or other errors
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Place a market order to close a margin position
 * @param config - Binance API configuration
 * @param symbol - Trading pair symbol
 * @param side - Original position side (LONG or SHORT)
 * @param quantity - Amount to close
 * @param sideEffectType - How to handle borrowing/repayment
 * @returns Exchange result with order response
 */
export async function placeMarginCloseOrder(
  config: BinanceConfig,
  symbol: string,
  side: "LONG" | "SHORT",
  quantity: number,
  sideEffectType: 'NO_SIDE_EFFECT' | 'MARGIN_BUY' | 'AUTO_REPAY' = 'AUTO_REPAY'
): Promise<ExchangeResult> {
  try {
    console.log("[Margin Service] Placing close order:", { symbol, side, quantity, sideEffectType });

    const client = new MarginTrading({ configurationRestAPI: config });

    // Determine opposite side for closing the position
    const orderSide = side === "LONG" ? "SELL" : "BUY";

    // Build close order parameters
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orderParams: any = {
      symbol,
      side: orderSide,
      type: "MARKET",
      quantity,
      sideEffectType,
    };

    console.log("[Margin Service] Close order params:", orderParams);

    // Place the close order on Binance
    const response = await client.restAPI.marginAccountNewOrder(orderParams);
    const data = await response.data();

    console.log("[Margin Service] Close order placed successfully:", data);

    return {
      success: true,
      data: data as BinanceOrderResponse,
    };
  } catch (error: unknown) {
    console.error("[Margin Service] Error placing close order:", error);

    // Handle Binance API errors
    if (
      error &&
      typeof error === "object" &&
      "response" in error &&
      error.response &&
      typeof error.response === "object" &&
      "data" in error.response
    ) {
      const binanceError = (
        error.response as { data: { msg?: string; code?: number } }
      ).data;
      return {
        success: false,
        error: binanceError.msg || "Unknown Binance error",
        code: binanceError.code,
      };
    }

    // Handle network or other errors
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Get maximum borrowable amount for an asset
 * @param config - Binance API configuration
 * @param asset - Asset to query
 * @returns Max borrowable amount
 */
export async function getMaxBorrowable(
  config: BinanceConfig,
  asset: string
): Promise<{ amount: number; asset: string } | null> {
  try {
    const client = new MarginTrading({ configurationRestAPI: config });
    const response = await client.restAPI.queryMaxBorrow({
      asset,
      isolatedSymbol: undefined,
    });
    const data = await response.data();

    return {
      amount: parseFloat(data.amount || "0"),
      asset: asset,
    };
  } catch (error) {
    console.error("[Margin Service] Error getting max borrowable:", error);
    return { amount: 0, asset: "USDT" };
  }
}
