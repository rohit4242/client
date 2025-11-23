import { createOrderDataSchema } from '@/db/schema/order';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import db from '@/db';
import { getPriceBySymbol } from '@/lib/trading-utils';
import { createPosition } from '@/db/actions/position';
import { updatePosition } from '@/db/actions/position/update-position';
import { recalculatePortfolioStatsInternal } from '@/db/actions/portfolio/recalculate-stats';
import { revalidatePath } from 'next/cache';
import { placeMarginOrder } from '@/lib/binance-margin';

/**
 * POST /api/margin/order/create
 * Create a new margin order on Binance
 */
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
      console.error('Validation error:', validatedOrder.error);
      return NextResponse.json(
        {
          error: 'Invalid order data',
          details: validatedOrder.error,
        },
        { status: 400 }
      );
    }

    const { exchange, order, userId: requestUserId } = validatedOrder.data;

    console.log('Margin Order - exchange: ', exchange);
    console.log('Margin Order - order: ', order);

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
      // Revalidate admin layout to refresh user list with updated portfolio status
      revalidatePath('/admin');
    }

    if (!portfolio) {
      return NextResponse.json(
        { error: 'User account not found' },
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

    console.log('Current price: ', currentPrice);

    // Calculate quantity from quoteOrderQty if quantity is not provided (for MARKET orders only)
    let positionQuantity = parseFloat(order.quantity || '0');
    if (positionQuantity === 0 && order.type === 'MARKET' && 'quoteOrderQty' in order && order.quoteOrderQty) {
      // For market orders with quoteOrderQty, estimate quantity from current price
      positionQuantity = parseFloat(order.quoteOrderQty) / parseFloat(currentPrice.price);
    }

    // Create position in database first (also creates Order record)
    const positionResult = await createPosition({
      symbol: order.symbol,
      side: order.side === 'BUY' ? 'Long' : 'Short',
      type: order.type === 'MARKET' ? 'Market' : 'Limit',
      entryPrice: parseFloat(currentPrice.price),
      quantity: positionQuantity,
      portfolioId: portfolio.id,
    });

    if (!positionResult.success) {
      return NextResponse.json(
        { error: 'Failed to create position' },
        { status: 500 }
      );
    }

    // Extract both positionId and orderId (database IDs, not Binance IDs)
    const dbPositionId = positionResult.positionId;
    const dbOrderId = positionResult.orderId;

    if (!dbPositionId || !dbOrderId) {
      return NextResponse.json(
        { error: 'Position or Order ID not found' },
        { status: 404 }
      );
    }

    // Prepare margin order parameters
    // Convert empty strings to undefined to avoid sending empty values
    const quantity = order.quantity && order.quantity.trim() !== '' ? order.quantity : undefined;
    // quoteOrderQty only exists on MARKET orders
    const quoteOrderQty = order.type === 'MARKET' && 'quoteOrderQty' in order && order.quoteOrderQty && order.quoteOrderQty.trim() !== '' 
      ? order.quoteOrderQty 
      : undefined;
    
    const marginOrderParams = {
      symbol: order.symbol,
      side: order.side as 'BUY' | 'SELL',
      type: order.type as 'MARKET' | 'LIMIT',
      quantity,
      quoteOrderQty,
      price: 'price' in order && order.price ? order.price : undefined,
      sideEffectType: order.sideEffectType as
        | 'NO_SIDE_EFFECT'
        | 'MARGIN_BUY'
        | 'AUTO_REPAY'
        | undefined,
      timeInForce: 'timeInForce' in order ? order.timeInForce : undefined,
    };

    console.log('Placing margin order:', marginOrderParams);

    // Place margin order on Binance
    const binanceOrderResult = await placeMarginOrder(
      configurationRestAPI,
      marginOrderParams
    );

    console.log('Binance margin order result:', binanceOrderResult);

    // Extract order information
    const executedQty = parseFloat(binanceOrderResult.executedQty || '0');
    const cummulativeQuoteQty = parseFloat(
      binanceOrderResult.cummulativeQuoteQty || '0'
    );
    const avgPrice =
      executedQty > 0 ? cummulativeQuoteQty / executedQty : parseFloat(currentPrice.price);

    // Update position with actual execution data
    // Use database orderId (not Binance orderId)
    await updatePosition({
      positionId: dbPositionId,
      orderId: dbOrderId,
      binanceResponse: binanceOrderResult,
    });

    // Recalculate portfolio stats
    await recalculatePortfolioStatsInternal(portfolio.id);

    // Revalidate relevant pages
    revalidatePath('/admin');
    revalidatePath('/agent');

    return NextResponse.json({
      success: true,
      message: 'Margin order successfully created',
      data: {
        order: binanceOrderResult,
        positionId: dbPositionId,
        orderId: dbOrderId,
      },
    });
  } catch (error: unknown) {
    console.error('Error creating margin order:', error);

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

