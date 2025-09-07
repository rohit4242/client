import { createOrderDataSchema } from "@/db/schema/order";
import { auth } from "@/lib/auth";
import { Spot, SpotRestAPI } from "@binance/spot";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import db from "@/db";

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

    // Map order parameters to Binance format
    const side: SpotRestAPI.NewOrderSideEnum =
      order.side === "BUY"
        ? SpotRestAPI.NewOrderSideEnum.BUY
        : SpotRestAPI.NewOrderSideEnum.SELL;

    const type: SpotRestAPI.NewOrderTypeEnum =
      order.type === "MARKET"
        ? SpotRestAPI.NewOrderTypeEnum.MARKET
        : SpotRestAPI.NewOrderTypeEnum.LIMIT;

    // Prepare order parameters based on order type
    let orderParams: Record<string, string | SpotRestAPI.NewOrderSideEnum | SpotRestAPI.NewOrderTypeEnum>;

    if (order.type === "MARKET") {
      // For market orders, use either quantity or quoteOrderQty
      if (order.quoteOrderQty && parseFloat(order.quoteOrderQty) > 0) {
        orderParams = {
          symbol: order.symbol,
          side,
          type,
          quoteOrderQty: order.quoteOrderQty,
        };
      } else if (order.quantity && parseFloat(order.quantity) > 0) {
        orderParams = {
          symbol: order.symbol,
          side,
          type,
          quantity: order.quantity,
        };
      } else {
        return NextResponse.json(
          { error: "Either quantity or quoteOrderQty is required for market orders" },
          { status: 400 }
        );
      }
    } else if (order.type === "LIMIT") {
      // For limit orders, quantity and price are required
      if (!order.quantity || !order.price) {
        return NextResponse.json(
          { error: "Quantity and price are required for limit orders" },
          { status: 400 }
        );
      }
      
      orderParams = {
        symbol: order.symbol,
        side,
        type,
        quantity: order.quantity,
        price: order.price,
        timeInForce: order.timeInForce || "GTC",
      };
    } else {
      return NextResponse.json(
        { error: "Invalid order type" },
        { status: 400 }
      );
    }

    console.log("Placing order with params:", orderParams); 

    // Place the order on Binance
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orderResponse = await client.restAPI.newOrder(orderParams as any);
    const data = await orderResponse.data();

    console.log("Order placed successfully:", data);

    // Store order in database for tracking (optional)
    try {
      // Calculate values for database storage
      const orderQuantity = data.origQty || (order.type === "LIMIT" ? order.quantity : order.quantity) || "0";
      const orderPrice = data.price || (order.type === "LIMIT" ? order.price : "0") || "0";
      const orderValue = data.cummulativeQuoteQty || (parseFloat(orderQuantity) * parseFloat(orderPrice)).toString();
      
      // Map order side and type to database enums
      const dbSide = order.side === "BUY" ? "Buy" : "Sell";
      const dbType = order.type === "MARKET" ? "Market" : "Limit";
      const dbStatus = data.status === "FILLED" ? "Filled" : 
                      data.status === "CANCELED" ? "Canceled" : "Pending";

      await db.order.create({
        data: {
          userAccountId: userAccount.id,
          symbol: order.symbol,
          side: dbSide as "Buy" | "Sell",
          type: dbType as "Market" | "Limit",
          quantity: parseFloat(orderQuantity),
          price: parseFloat(orderPrice),
          value: parseFloat(orderValue),
          status: dbStatus as "Pending" | "Filled" | "Canceled",
        },
      });
      
      console.log("Order stored in database successfully");
    } catch (dbError) {
      console.warn("Failed to store order in database:", dbError);
      // Don't fail the request if DB storage fails
    }

    return NextResponse.json({
      success: true,
      message: "Order placed successfully",
      order: {
        orderId: data.orderId,
        symbol: data.symbol,
        side: data.side,
        type: data.type,
        quantity: data.origQty || "0",
        price: data.price,
        status: data.status,
        transactTime: data.transactTime,
        fills: data.fills || [],
      },
    });
  } catch (error: unknown) {
    console.error("Error creating order:", error);
    
    // Handle Binance API errors
    if (error && typeof error === 'object' && 'response' in error && 
        error.response && typeof error.response === 'object' && 'data' in error.response) {
      const binanceError = (error.response as { data: { msg?: string; code?: number } }).data;
      return NextResponse.json(
        {
          error: "Order placement failed",
          message: binanceError.msg || "Unknown Binance error",
          code: binanceError.code,
        },
        { status: 400 }
      );
    }
    
    // Handle network or other errors
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json(
      {
        error: "Internal server error",
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}
