/**
 * Unified Trading Order API Route
 * Handles both spot and margin order creation
 * Used by manual trading UI and can be used by signal bot
 */

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { executeOrder, validateOrderRequest } from "@/lib/services/order-service";
import { createOrderDataSchema } from "@/db/schema/order";
import { revalidatePath } from "next/cache";
import db from "@/db";

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedOrder = createOrderDataSchema.safeParse(body);

    if (!validatedOrder.success) {
      console.error("[Trading API] Validation error:", validatedOrder.error);
      return NextResponse.json(
        {
          error: "Invalid order data",
          details: validatedOrder.error.message,
        },
        { status: 400 }
      );
    }

    const { exchange, order, userId: requestUserId, portfolioId: requestPortfolioId } = validatedOrder.data;

    // Use userId from request if provided (admin action), otherwise use session user
    const targetUserId = requestUserId || session.user.id;

    // Get or create portfolio
    let portfolio = await db.portfolio.findFirst({
      where: { userId: targetUserId },
    });

    if (!portfolio && requestUserId) {
      portfolio = await db.portfolio.create({
        data: { userId: targetUserId },
      });
      revalidatePath("/admin");
    }

    if (!portfolio) {
      return NextResponse.json(
        { error: "User account not found" },
        { status: 404 }
      );
    }

    const portfolioId = requestPortfolioId || portfolio.id;

    // Determine account type from order data
    const accountType: "spot" | "margin" = 
      "sideEffectType" in order && order.sideEffectType && order.sideEffectType !== "NO_SIDE_EFFECT"
        ? "margin"
        : "spot";

    // Build order request
    const orderRequest = {
      userId: targetUserId,
      portfolioId,
      
      exchange,
      accountType,
      order: {
        symbol: order.symbol,
        side: order.side as "BUY" | "SELL",
        type: order.type as "MARKET" | "LIMIT",
        quantity: order.quantity,
        quoteOrderQty: "quoteOrderQty" in order ? order.quoteOrderQty : undefined,
        price: "price" in order ? order.price : undefined,
        timeInForce: "timeInForce" in order ? order.timeInForce : undefined,
        sideEffectType: "sideEffectType" in order ? order.sideEffectType : undefined,
      },
      source: "MANUAL" as const,
    };

    // Validate order request
    const validation = validateOrderRequest(orderRequest);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Execute order using the service
    console.log("[Trading API] Executing order:", orderRequest);
    const result = await executeOrder(orderRequest);

    // Handle result
    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error || "Failed to execute order",
          code: result.code,
        },
        { status: 400 }
      );
    }

    // Revalidate relevant pages
    revalidatePath("/admin");
    revalidatePath("/agent");

    console.log("[Trading API] Order executed successfully:", result);

    return NextResponse.json({
      success: true,
      message: "Order executed successfully",
      data: {
        positionId: result.positionId,
        orderId: result.orderId,
        executedQty: result.executedQty,
        executedPrice: result.executedPrice,
      },
    });
  } catch (error: unknown) {
    console.error("[Trading API] Error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";

    return NextResponse.json(
      {
        error: "Internal server error",
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}

