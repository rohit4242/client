import { createOrderDataSchema } from "@/db/schema/order";
import { auth } from "@/lib/auth";
import { Spot, SpotRestAPI } from "@binance/spot";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import db from "@/db";
import { getTradingPairInfo } from "@/db/actions/account/get-trading-pain-info";
import { validateLotSizeFilter, validateNotionalFilter, SymbolInfo } from "@/lib/trading-calculations";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedOrder = createOrderDataSchema.safeParse(body);
    if (!validatedOrder.success) {
      return NextResponse.json(
        {
          error: "Invalid order data",
          details: validatedOrder.error,
        },
        { status: 400 }
      );
    }

    const { exchange, order } = validatedOrder.data;

    console.log("exchange: ", exchange);
    console.log("order: ", order);
    // Get user account
    const userAccount = await db.userAccount.findFirst({
      where: { userId: session.user.id },
    });

    if (!userAccount) {
      return NextResponse.json(
        { error: "User account not found" },
        { status: 404 }
      );
    }

    // Configure Binance client
    const configurationRestAPI = {
      apiKey: exchange.apiKey,
      apiSecret: exchange.apiSecret,
    };

    const client = new Spot({
      configurationRestAPI,
    });

    const exchangeInfo = await getTradingPairInfo(order.symbol, exchange);

    // Validate quantity against LOT_SIZE filter if exchange info is available
    const originalQuantity = parseFloat(order.quantity || "0");
    const adjustedPrice =
      order.type === "LIMIT" ? parseFloat(order.price || "0") : undefined;

    // Find symbol info and validate filters
    let adjustedQuantity = originalQuantity;
    let lotSizeValidation = null;
    let notionalValidation = null;

    if (exchangeInfo && exchangeInfo.exchangeInfo?.symbols) {
      const symbolInfo = exchangeInfo.exchangeInfo.symbols.find(
        (s) => s.symbol === order.symbol
      ) as SymbolInfo | undefined;

      if (symbolInfo) {
        console.log("Symbol filters:", symbolInfo.filters);

        // Validate lot size first
        lotSizeValidation = validateLotSizeFilter(originalQuantity, symbolInfo);
        adjustedQuantity = lotSizeValidation.adjustedQuantity;

        // Then validate notional if we have a price
        if (adjustedPrice && adjustedPrice > 0) {
          notionalValidation = validateNotionalFilter(
            adjustedQuantity, 
            adjustedPrice, 
            symbolInfo, 
            order.type
          );
          adjustedQuantity = notionalValidation.adjustedQuantity;
        }

        console.log("Filter validation results:", {
          originalQuantity,
          adjustedQuantity,
          lotSizeAdjustments: lotSizeValidation.adjustments,
          notionalAdjustments: notionalValidation?.adjustments || [],
          lotSizeValid: lotSizeValidation.isValid,
          notionalValid: notionalValidation?.isValid ?? true,
        });

        // Log all adjustments
        [...(lotSizeValidation.adjustments || []), ...(notionalValidation?.adjustments || [])]
          .forEach((adjustment) => console.log("Adjustment:", adjustment));

        // Check if any validation failed
        if (!lotSizeValidation.isValid) {
          return NextResponse.json(
            { 
              error: "Lot size validation failed", 
              details: lotSizeValidation.error 
            },
            { status: 400 }
          );
        }

        if (notionalValidation && !notionalValidation.isValid) {
          return NextResponse.json(
            { 
              error: "Notional validation failed", 
              details: notionalValidation.error 
            },
            { status: 400 }
          );
        }
      }
    }

    // Validate required parameters with adjusted values
    if (adjustedQuantity <= 0) {
      return NextResponse.json({ error: "Invalid quantity" }, { status: 400 });
    }

    if (order.type === "LIMIT" && (!adjustedPrice || adjustedPrice <= 0)) {
      return NextResponse.json(
        { error: "Invalid price for limit order" },
        { status: 400 }
      );
    }

    // Map order parameters to Binance format
    const side: SpotRestAPI.NewOrderSideEnum =
      order.side === "BUY"
        ? SpotRestAPI.NewOrderSideEnum.BUY
        : SpotRestAPI.NewOrderSideEnum.SELL;

    const type: SpotRestAPI.NewOrderTypeEnum =
      order.type === "MARKET"
        ? SpotRestAPI.NewOrderTypeEnum.MARKET
        : SpotRestAPI.NewOrderTypeEnum.LIMIT;

    // Build Binance order parameters based on order type
    let orderParams: SpotRestAPI.NewOrderRequest;

    if (order.type === "LIMIT") {
      orderParams = {
        symbol: order.symbol,
        side,
        type,
        price: adjustedPrice!,
        quantity: adjustedQuantity,
        newOrderRespType: SpotRestAPI.NewOrderNewOrderRespTypeEnum.FULL,
      };
    } else if (order.type === "MARKET") {
      // For MARKET orders, handle quoteOrderQty if provided, otherwise use quantity
      if ("quoteOrderQty" in order && order.quoteOrderQty) {
        const quoteQty = parseFloat(order.quoteOrderQty);
        if (quoteQty > 0) {
          orderParams = {
            symbol: order.symbol,
            side,
            type,
            quoteOrderQty: quoteQty,
            newOrderRespType: SpotRestAPI.NewOrderNewOrderRespTypeEnum.FULL,
          };
        } else {
          orderParams = {
            symbol: order.symbol,
            side,
            type,
            quantity: adjustedQuantity,
            newOrderRespType: SpotRestAPI.NewOrderNewOrderRespTypeEnum.FULL,
          };
        }
      } else {
        orderParams = {
          symbol: order.symbol,
          side,
          type,
          quantity: adjustedQuantity,
          newOrderRespType: SpotRestAPI.NewOrderNewOrderRespTypeEnum.FULL,
        };
      }
    }

    // Calculate estimated value for database storage using adjusted values
    const estimatedPrice = adjustedPrice || 0;
    const orderValue = adjustedQuantity * estimatedPrice;

    // Use database transaction to ensure consistency
    return await db
      .$transaction(async (tx) => {
        // Create order in database first (with pending status)
        console.log("Creating order in database");
        const dbOrder = await tx.order.create({
          data: {
            symbol: order.symbol,
            side: order.side === "BUY" ? "Buy" : "Sell",
            type: order.type === "MARKET" ? "Market" : "Limit",
            price: estimatedPrice,
            quantity: adjustedQuantity,
            value: orderValue,
            status: "Pending",
            userAccountId: userAccount.id,
          },
        });

        try {
          console.log("Executing order on Binance");
          // Execute order on Binance
          console.log("orderParams: ", orderParams);
          const binanceResponseRaw = await client.restAPI.newOrder(orderParams);
          console.log("binanceResponseRaw: ", binanceResponseRaw);
          const binanceResponse = (await binanceResponseRaw.data()) as SpotRestAPI.NewOrderResponse;

          console.log("binanceResponse: ", JSON.stringify(binanceResponse));

          // Update database order with actual execution details
          const actualPrice = parseFloat(binanceResponse.price || "0");
          const actualQuantity = parseFloat(
            binanceResponse.executedQty || binanceResponse.origQty || "0"
          );
          const actualValue = actualPrice * actualQuantity;

          const updatedOrder = await tx.order.update({
            where: { id: dbOrder.id },
            data: {
              price: actualPrice > 0 ? actualPrice : estimatedPrice,
              quantity: actualQuantity > 0 ? actualQuantity : adjustedQuantity,
              value: actualValue > 0 ? actualValue : orderValue,
              status:
                binanceResponse.status === "FILLED"
                  ? "Filled"
                  : binanceResponse.status === "CANCELED"
                  ? "Canceled"
                  : "Pending",
            },
          });

          return NextResponse.json({
            success: true,
            order: updatedOrder,
            binanceResponse,
            message: "Order created successfully",
            lotSizeAdjustments: lotSizeValidation?.adjustments || [],
            notionalAdjustments: notionalValidation?.adjustments || [],
            quantityAdjusted: originalQuantity !== adjustedQuantity,
          });
        } catch (binanceError) {
          console.error("Binance API error:", binanceError);

          // Transaction will automatically rollback, but we still update status for clarity
          await tx.order.update({
            where: { id: dbOrder.id },
            data: { status: "Canceled" },
          });

          // Extract error message from Binance error
          let errorMessage = "Failed to execute order on Binance";
          if (binanceError instanceof Error) {
            errorMessage = binanceError.message;
          }

          // Throw error to trigger transaction rollback
          throw new Error(
            JSON.stringify({
              error: "Order execution failed",
              details: errorMessage,
              orderId: dbOrder.id,
            })
          );
        }
      })
      .catch((transactionError) => {
        // Handle transaction errors
        try {
          const errorData = JSON.parse(transactionError.message);
          return NextResponse.json(errorData, { status: 400 });
        } catch {
          console.error("Transaction error:", transactionError);
          return NextResponse.json(
            { error: "Order processing failed" },
            { status: 500 }
          );
        }
      });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
