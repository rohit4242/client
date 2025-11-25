/**
 * Binance Spot Trading Service
 * Handles spot order execution on Binance
 */

import { Spot, SpotRestAPI } from "@binance/spot";
import { BinanceConfig, SpotOrderParams, BinanceOrderResponse, ExchangeResult } from "./types";

/**
 * Place a spot order on Binance
 * @param config - Binance API configuration
 * @param params - Spot order parameters
 * @returns Exchange result with order response
 */
export async function placeSpotOrder(
  config: BinanceConfig,
  params: SpotOrderParams
): Promise<ExchangeResult> {
  try {
    console.log("[Spot Service] Placing order:", params);

    const client = new Spot({
      configurationRestAPI: config,
    });

    // Map order parameters to Binance format
    const side: SpotRestAPI.NewOrderSideEnum =
      params.side === "BUY"
        ? SpotRestAPI.NewOrderSideEnum.BUY
        : SpotRestAPI.NewOrderSideEnum.SELL;

    const type: SpotRestAPI.NewOrderTypeEnum =
      params.type === "MARKET"
        ? SpotRestAPI.NewOrderTypeEnum.MARKET
        : SpotRestAPI.NewOrderTypeEnum.LIMIT;

    // Build order parameters based on order type
    let orderParams: Record<
      string,
      string | SpotRestAPI.NewOrderSideEnum | SpotRestAPI.NewOrderTypeEnum
    >;

    if (params.type === "MARKET") {
      // For market orders, use either quantity or quoteOrderQty
      if (params.quoteOrderQty && parseFloat(params.quoteOrderQty) > 0) {
        orderParams = {
          symbol: params.symbol,
          side,
          type,
          quoteOrderQty: params.quoteOrderQty,
        };
      } else if (params.quantity && parseFloat(params.quantity) > 0) {
        orderParams = {
          symbol: params.symbol,
          side,
          type,
          quantity: params.quantity,
        };
      } else {
        return {
          success: false,
          error: "Either quantity or quoteOrderQty is required for market orders",
        };
      }
    } else if (params.type === "LIMIT") {
      // For limit orders, quantity and price are required
      if (!params.quantity || !params.price) {
        return {
          success: false,
          error: "Quantity and price are required for limit orders",
        };
      }

      orderParams = {
        symbol: params.symbol,
        side,
        type,
        quantity: params.quantity,
        price: params.price,
        timeInForce: params.timeInForce || "GTC",
      };
    } else {
      return {
        success: false,
        error: "Invalid order type",
      };
    }

    console.log("[Spot Service] Order params:", orderParams);

    // Place the order on Binance
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orderResponse = await client.restAPI.newOrder(orderParams as any);
    const data = await orderResponse.data();

    console.log("[Spot Service] Order placed successfully:", data);

    return {
      success: true,
      data: data as BinanceOrderResponse,
    };
  } catch (error: unknown) {
    console.error("[Spot Service] Error placing order:", error);

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
 * Place a market order to close a position
 * @param config - Binance API configuration
 * @param symbol - Trading pair symbol
 * @param side - Original position side (LONG or SHORT)
 * @param quantity - Amount to close
 * @returns Exchange result with order response
 */
export async function placeSpotCloseOrder(
  config: BinanceConfig,
  symbol: string,
  side: "LONG" | "SHORT",
  quantity: number
): Promise<ExchangeResult> {
  try {
    console.log("[Spot Service] Placing close order:", { symbol, side, quantity });

    const client = new Spot({
      configurationRestAPI: config,
    });

    // Determine opposite side for closing the position
    const orderSide: SpotRestAPI.NewOrderSideEnum =
      side === "LONG"
        ? SpotRestAPI.NewOrderSideEnum.SELL // Close long position with sell order
        : SpotRestAPI.NewOrderSideEnum.BUY; // Close short position with buy order

    // Use market order for quick execution
    const type: SpotRestAPI.NewOrderTypeEnum = SpotRestAPI.NewOrderTypeEnum.MARKET;

    const orderParams = {
      symbol,
      side: orderSide,
      type,
      quantity: quantity.toString(),
    };

    console.log("[Spot Service] Close order params:", orderParams);

    // Place the close order on Binance
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orderResponse = await client.restAPI.newOrder(orderParams as any);
    const data = await orderResponse.data();

    console.log("[Spot Service] Close order placed successfully:", data);

    return {
      success: true,
      data: data as BinanceOrderResponse,
    };
  } catch (error: unknown) {
    console.error("[Spot Service] Error placing close order:", error);

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

