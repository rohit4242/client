import { ValidationError } from "@/lib/order-validation";
import { TradingFormData } from "@/db/schema/order";
import { configurationRestAPI } from "@/types/binance";
import { Spot } from "@binance/spot";
import { SpotRestAPI } from "@binance/spot";

export interface PlaceOrderResult {
  success: boolean;
  errors?: ValidationError[];
  warnings?: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any;
  message?: string;
  code?: number;
}

/**
 * Round quantity to appropriate precision for Binance trading
 * Different trading pairs have different precision requirements
 */
function formatQuantityPrecision(quantity: number, symbol: string): number {
  // Default precision based on asset type
  let precision = 6; // Default for most pairs
  
  // BTC pairs typically use 5-6 decimals for quantity
  if (symbol.includes('BTC')) {
    precision = 5;
  }
  // ETH pairs typically use 4-5 decimals
  else if (symbol.includes('ETH')) {
    precision = 4;
  }
  // Stablecoins and most altcoins use 2-4 decimals
  else if (symbol.includes('USDT') || symbol.includes('USDC') || symbol.includes('BUSD')) {
    precision = 3;
  }
  
  // Round down to avoid "over maximum" errors
  const multiplier = Math.pow(10, precision);
  return Math.floor(quantity * multiplier) / multiplier;
}

/**
 * Universal function for placing orders on Binance (no database operations)
 *
 * This function only places the order on Binance exchange and returns the response.
 * Database operations for positions and orders are handled by separate functions.
 *
 * @param orderData - The order data (symbol, side, type, quantity, price, etc.)
 * @param configurationRestAPI - Exchange configuration with API keys
 * @returns Promise<PlaceOrderResult> - Result with success status, data, errors, and warnings
 */
export async function placeOrder(
  orderData: TradingFormData,
  configurationRestAPI: configurationRestAPI
): Promise<PlaceOrderResult> {
  try {
  
    // Step 1: Place order on Binance
    console.log("Placing order on Binance...");

    const client = new Spot({
      configurationRestAPI,
    });

    // Map order parameters to Binance format
    const side: SpotRestAPI.NewOrderSideEnum =
      orderData.side === "BUY"
        ? SpotRestAPI.NewOrderSideEnum.BUY
        : SpotRestAPI.NewOrderSideEnum.SELL;

    const type: SpotRestAPI.NewOrderTypeEnum =
      orderData.type === "MARKET"
        ? SpotRestAPI.NewOrderTypeEnum.MARKET
        : SpotRestAPI.NewOrderTypeEnum.LIMIT;

    // Prepare order parameters based on order type
    let orderParams: Record<
      string,
      string | SpotRestAPI.NewOrderSideEnum | SpotRestAPI.NewOrderTypeEnum
    >;

    if (orderData.type === "MARKET") {
      // For market orders, use either quantity or quoteOrderQty
      if (orderData.quoteOrderQty && parseFloat(orderData.quoteOrderQty) > 0) {
        orderParams = {
          symbol: orderData.symbol,
          side,
          type,
          quoteOrderQty: orderData.quoteOrderQty,
        };
      } else if (orderData.quantity && parseFloat(orderData.quantity) > 0) {
        orderParams = {
          symbol: orderData.symbol,
          side,
          type,
          quantity: orderData.quantity,
        };
      } else {
        return {
          success: false,
          errors: [
            {
              field: "quantity",
              message:
                "Either quantity or quoteOrderQty is required for market orders",
              code: "MISSING_QUANTITY",
            },
          ],
        };
      }
    } else if (orderData.type === "LIMIT") {
      // For limit orders, quantity and price are required
      if (!orderData.quantity || !orderData.price) {
        return {
          success: false,
          errors: [
            {
              field: orderData.quantity ? "price" : "quantity",
              message: "Quantity and price are required for limit orders",
              code: "MISSING_REQUIRED_FIELD",
            },
          ],
        };
      }

      orderParams = {
        symbol: orderData.symbol,
        side,
        type,
        quantity: orderData.quantity,
        price: orderData.price,
        timeInForce: orderData.timeInForce || "GTC",
      };
    } else {
      return {
        success: false,
        errors: [
          {
            field: "type",
            message: "Invalid order type",
            code: "INVALID_ORDER_TYPE",
          },
        ],
      };
    }

    console.log("Placing order with params:", orderParams);

    // Place the order on Binance
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orderResponse = await client.restAPI.newOrder(orderParams as any);
    const data = await orderResponse.data();

    console.log("Order placed successfully on Binance:", data);

    return {
      success: true,
      message: "Order placed successfully",
      data : data,
      warnings: [],
    };
  } catch (error: unknown) {
    console.error("Error placing order on Binance:", error);

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
        message: binanceError.msg || "Unknown Binance error",
        code: binanceError.code,
        errors: [
          {
            field: "general",
            message: binanceError.msg || "Order placement failed",
            code: binanceError.code?.toString() || "BINANCE_ERROR",
          },
        ],
      };
    }

    // Handle network or other errors
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return {
      success: false,
      message: errorMessage,
      errors: [
        {
          field: "general",
          message: errorMessage,
          code: "INTERNAL_ERROR",
        },
      ],
    };
  }
}

/**
 * Place close order for an existing position (opposite side order)
 * 
 * @param position - The position to close
 * @param configurationRestAPI - Exchange configuration with API keys
 * @returns Promise<PlaceOrderResult> - Result with success status, data, errors, and warnings
 */
export async function placeCloseOrder(
  position: {
    symbol: string;
    side: "LONG" | "SHORT";
    quantity: number;
    accountType?: "SPOT" | "MARGIN";
    autoRepay?: boolean;
  },
  configurationRestAPI: configurationRestAPI
): Promise<PlaceOrderResult> {
  try {
    console.log("Placing close order on Binance...");
    console.log(`Position type: ${position.accountType || 'SPOT'}`);

    // Determine opposite side for closing the position
    const side = position.side === "LONG" ? "SELL" : "BUY";

    // Format quantity to proper precision for Binance
    const formattedQuantity = formatQuantityPrecision(position.quantity, position.symbol);
    
    console.log(`Close order quantity formatted: ${position.quantity} -> ${formattedQuantity}`);

    // Check if this is a margin position
    if (position.accountType === "MARGIN") {
      // Use Margin API for margin positions
      const { placeMarginOrder } = await import("@/lib/margin/binance-margin");
      
      // Determine side effect based on bot's autoRepay setting
      // If autoRepay is enabled, use AUTO_REPAY to automatically repay borrowed amounts
      // Otherwise, use NO_SIDE_EFFECT and user must manually repay
      const sideEffectType = position.autoRepay ? 'AUTO_REPAY' : 'NO_SIDE_EFFECT';
      
      console.log(`Margin close order - autoRepay: ${position.autoRepay}, sideEffectType: ${sideEffectType}`);
      
      const orderParams = {
        symbol: position.symbol,
        side: side as 'BUY' | 'SELL',
        type: 'MARKET' as const,
        quantity: formattedQuantity.toString(),
        sideEffectType: sideEffectType as 'NO_SIDE_EFFECT' | 'AUTO_REPAY',
      };

      console.log("Placing MARGIN close order with params:", orderParams);

      const data = await placeMarginOrder(configurationRestAPI, orderParams);

      console.log("Margin close order placed successfully:", data);

      return {
        success: true,
        message: "Margin close order placed successfully",
        data,
        warnings: [],
      };
    } else {
      // Use Spot API for spot positions
      const client = new Spot({
        configurationRestAPI,
      });

      const sideEnum: SpotRestAPI.NewOrderSideEnum =
        side === "SELL" 
          ? SpotRestAPI.NewOrderSideEnum.SELL
          : SpotRestAPI.NewOrderSideEnum.BUY;

      const type: SpotRestAPI.NewOrderTypeEnum = SpotRestAPI.NewOrderTypeEnum.MARKET;

      const orderParams = {
        symbol: position.symbol,
        side: sideEnum,
        type,
        quantity: formattedQuantity.toString(),
      };

      console.log("Placing SPOT close order with params:", orderParams);

      // Place the close order on Binance
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const orderResponse = await client.restAPI.newOrder(orderParams as any);
      const data = await orderResponse.data();

      console.log("Spot close order placed successfully on Binance:", data);

      return {
        success: true,
        message: "Spot close order placed successfully",
        data,
        warnings: [],
      };
    }
  } catch (error: unknown) {
    console.error("Error placing close order on Binance:", error);

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
        message: binanceError.msg || "Unknown Binance error",
        code: binanceError.code,
        errors: [
          {
            field: "general",
            message: binanceError.msg || "Close order placement failed",
            code: binanceError.code?.toString() || "BINANCE_ERROR",
          },
        ],
      };
    }

    // Handle network or other errors
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return {
      success: false,
      message: errorMessage,
      errors: [
        {
          field: "general",
          message: errorMessage,
          code: "INTERNAL_ERROR",
        },
      ],
    };
  }
}
