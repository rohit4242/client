/**
 * Legacy Margin Order API Route
 * DEPRECATED: Use /api/trading/order instead
 * This route is kept for backward compatibility
 */

import { createOrderDataSchema } from '@/db/schema/order';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import db from '@/db';
import { executeOrder, validateOrderRequest } from '@/lib/services/order-service';
import { revalidatePath } from 'next/cache';

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate the full body first
    const validatedOrder = createOrderDataSchema.safeParse(body);
    if (!validatedOrder.success) {
      console.error('[Margin API] Validation error:', validatedOrder.error);
      return NextResponse.json(
        {
          error: 'Invalid order data',
          details: validatedOrder.error,
        },
        { status: 400 }
      );
    }

    const { exchange, order, userId: requestUserId } = validatedOrder.data;

    console.log('[Margin API] Order request:', { exchange: exchange.name, order });

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
        { error: 'User account not found' },
        { status: 404 }
      );
    }

    // Build order request for the service
    const orderRequest = {
      userId: targetUserId,
      portfolioId: portfolio.id,
      exchange,
      accountType: "margin" as const,
      order: {
        symbol: order.symbol,
        side: order.side as 'BUY' | 'SELL',
        type: order.type as 'MARKET' | 'LIMIT',
        quantity: order.quantity,
        quoteOrderQty: 'quoteOrderQty' in order ? order.quoteOrderQty : undefined,
        price: 'price' in order ? order.price : undefined,
        timeInForce: 'timeInForce' in order ? order.timeInForce : undefined,
        sideEffectType: order.sideEffectType as 'NO_SIDE_EFFECT' | 'MARGIN_BUY' | 'AUTO_REPAY' | undefined,
      },
      source: 'MANUAL' as const,
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
    console.log('[Margin API] Executing order via service');
    const result = await executeOrder(orderRequest);

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error || 'Order placement failed',
          code: result.code,
        },
        { status: 400 }
      );
    }

    // Revalidate paths
    revalidatePath('/admin');
    revalidatePath('/agent');

    console.log('[Margin API] Order executed successfully');

    return NextResponse.json({
      success: true,
      message: 'Margin order successfully created',
      data: {
        order: {
          positionId: result.positionId,
          orderId: result.orderId,
          executedQty: result.executedQty,
          executedPrice: result.executedPrice,
        },
        positionId: result.positionId,
        orderId: result.orderId,
      },
    });
  } catch (error: unknown) {
    console.error('[Margin API] Error:', error);

    const errorMessage =
      error instanceof Error ? error.message : 'Failed to create margin order';

    // Check for common Binance error codes
    if (errorMessage.includes('-2010')) {
      return NextResponse.json(
        { error: 'Insufficient balance for margin order' },
        { status: 400 }
      );
    }

    if (errorMessage.includes('-1021')) {
      return NextResponse.json(
        { error: 'Timestamp for this request is outside of the recvWindow' },
        { status: 400 }
      );
    }

    if (errorMessage.includes('-1022')) {
      return NextResponse.json(
        { error: 'Signature for this request is not valid' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

