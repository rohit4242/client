/**
 * Legacy Spot Order API Route
 * DEPRECATED: Use /api/trading/order instead
 * This route is kept for backward compatibility
 */

import { createOrderDataSchema } from "@/db/schema/order";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import db from "@/db";
import { executeOrder, validateOrderRequest } from "@/lib/services/order-service";
import { revalidatePath } from "next/cache";

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
      console.error("[Spot API] Validation error:", validatedOrder.error);
      return NextResponse.json(
        {
          error: "Invalid order data",
          details: validatedOrder.error,
        },
        { status: 400 }
      );
    }

    const { exchange, order, userId: requestUserId } = validatedOrder.data;

    console.log("[Spot API] Order request:", { exchange: exchange.name, order });

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
      revalidatePath('/admin');
    }

    if (!portfolio) {
      return NextResponse.json(
        { error: "User account not found" },
        { status: 404 }
      );
    }

    // Build order request for the service
    const orderRequest = {
      userId: targetUserId,
      portfolioId: portfolio.id,
      exchange,
      accountType: "spot" as const,
      order: {
        symbol: order.symbol,
        side: order.side as "BUY" | "SELL",
        type: order.type as "MARKET" | "LIMIT",
        quantity: order.quantity,
        quoteOrderQty: "quoteOrderQty" in order ? order.quoteOrderQty : undefined,
        price: "price" in order ? order.price : undefined,
        timeInForce: "timeInForce" in order ? order.timeInForce : undefined,
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
    console.log("[Spot API] Executing order via service");
    const result = await executeOrder(orderRequest);

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error || "Order placement failed",
          code: result.code,
        },
        { status: 400 }
      );
    }

    // Revalidate paths
    revalidatePath('/admin');
    revalidatePath('/agent');

    console.log("[Spot API] Order executed successfully");

    return NextResponse.json({
      success: true,
      message: "Order placed successfully",
      order: {
        positionId: result.positionId,
        orderId: result.orderId,
        executedQty: result.executedQty,
        executedPrice: result.executedPrice,
      },
    });
  } catch (error: unknown) {
    console.error("[Spot API] Error:", error);

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
