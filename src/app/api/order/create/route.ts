import { createOrderDataSchema } from "@/db/schema/order";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import db from "@/db";
import { placeOrder } from "@/db/actions/order/create-order";
import { createPosition } from "@/db/actions/position";
import { getPriceBySymbol } from "@/lib/trading-utils";
import { updatePosition } from "@/db/actions/position/update-position";
import { recalculatePortfolioStats } from "@/db/actions/admin/update-portfolio-stats";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate the full body first
    const validatedOrder = createOrderDataSchema.safeParse(body);
    if (!validatedOrder.success) {
      console.error("Validation error:", validatedOrder.error);
      return NextResponse.json(
        {
          error: "Invalid order data",
          details: validatedOrder.error,
        },
        { status: 400 }
      );
    }

    const { exchange, order, userId: requestUserId } = validatedOrder.data;

    console.log("exchange: ", exchange);
    console.log("order: ", order);

    // Use userId from request if provided (admin action), otherwise use session user
    const targetUserId = requestUserId || session.user.id;

    // Get user account
    let portfolio = await db.portfolio.findFirst({
      where: { userId: targetUserId },
    });

    // Create portfolio if it doesn't exist
    if (!portfolio && requestUserId) {
      portfolio = await db.portfolio.create({
        data: { userId: targetUserId },
      });
    }

    if (!portfolio) {
      return NextResponse.json(
        { error: "User account not found" },
        { status: 404 }
      );
    }

    const configurationRestAPI = {
      apiKey: exchange.apiKey,
      apiSecret: exchange.apiSecret,
    };
    const currentPrice = await getPriceBySymbol(
      configurationRestAPI,
      order.symbol
    );

    console.log("currentPrice: ", currentPrice);

    const positionResult = await createPosition({
      symbol: order.symbol,
      side: order.side === "BUY" ? "Long" : "Short",
      type: order.type === "MARKET" ? "Market" : "Limit",
      entryPrice: parseFloat(currentPrice.price),
      quantity: order.quantity ? parseFloat(order.quantity) : 0,
      portfolioId: portfolio.id,
      
    });

    if (!positionResult.success) {
      return NextResponse.json(
        {
          success: false,
          errors: [
            {
              field: "general",
              message: "Failed to create position",
              code: "POSITION_CREATION_FAILED",
            },
          ],
        },
        { status: 400 }
      );
    }

    // Use the universal placeOrder function
    const result = await placeOrder(order, configurationRestAPI);

    // Update position and order with Binance response if order was successful
    if (result.success && result.data) {
      const updatePositionResult = await updatePosition({
        positionId: positionResult.positionId,
        orderId: positionResult.orderId,
        binanceResponse: result.data,
      });

      console.log("Position update result:", updatePositionResult);
    }

    console.log("result: ", result);

    if (!result.success) {
      // Clean up position if order placement fails
      try {
        await db.position.delete({ where: { id: positionResult.positionId } });
        await db.order.delete({ where: { id: positionResult.orderId } });
        console.log("Cleaned up position and order due to failed order placement");
      } catch (cleanupError) {
        console.error("Failed to clean up position and order:", cleanupError);
      }

      return NextResponse.json(
        {
          error: result.message || "Order placement failed",
          code: result.code,
          errors: result.errors,
          warnings: result.warnings,
        },
        { status: 400 }
      );
    }

    // Recalculate portfolio stats after successful order
    await recalculatePortfolioStats(targetUserId);

    return NextResponse.json({
      success: true,
      message: result.message,
      order: result.data,
      warnings: result.warnings,
    });
  } catch (error: unknown) {
    console.error("Error creating order:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json(
      {
        error: "Internal server error",
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}
