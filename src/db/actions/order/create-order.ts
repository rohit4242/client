import { ValidationError } from "@/lib/order-validation";
import { TradingFormData } from "@/db/schema/order";
import { configurationRestAPI } from "@/types/binance";
import { Spot } from "@binance/spot";
import { SpotRestAPI } from "@binance/spot";

export interface PlaceOrderResult {
  success: boolean;
  errors?: ValidationError[];
  warnings?: string[];
  data?: {
    orderId: string;
    symbol: string;
    side: string;
    type: string;
    quantity: string;
    price?: string;
    status: string;
    transactTime: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fills: any[];
  };
  message?: string;
  code?: number;
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
      data: {
        orderId: data.orderId?.toString() || "",
        symbol: data.symbol || "",
        side: data.side || "",
        type: data.type || "",
        quantity: data.origQty || "0",
        price: data.price || "",
        status: data.status || "",
        transactTime: data.transactTime || 0,
        fills: data.fills || [],
      },
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
  },
  configurationRestAPI: configurationRestAPI
): Promise<PlaceOrderResult> {
  try {
    console.log("Placing close order on Binance...");

    const client = new Spot({
      configurationRestAPI,
    });

    // Determine opposite side for closing the position
    const side: SpotRestAPI.NewOrderSideEnum =
      position.side === "LONG"
        ? SpotRestAPI.NewOrderSideEnum.SELL // Close long position with sell order
        : SpotRestAPI.NewOrderSideEnum.BUY; // Close short position with buy order

    // Use market order for quick execution
    const type: SpotRestAPI.NewOrderTypeEnum = SpotRestAPI.NewOrderTypeEnum.MARKET;

    const orderParams = {
      symbol: position.symbol,
      side,
      type,
      quantity: position.quantity.toString(),
    };

    console.log("Placing close order with params:", orderParams);

    // Place the close order on Binance
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orderResponse = await client.restAPI.newOrder(orderParams as any);
    const data = await orderResponse.data();

    console.log("Close order placed successfully on Binance:", data);

    return {
      success: true,
      message: "Close order placed successfully",
      data: {
        orderId: data.orderId?.toString() || "",
        symbol: data.symbol || "",
        side: data.side || "",
        type: data.type || "",
        quantity: data.origQty || "0",
        price: data.price || "",
        status: data.status || "",
        transactTime: data.transactTime || 0,
        fills: data.fills || [],
      },
      warnings: [],
    };
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
