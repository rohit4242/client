import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import db from '@/db';
import { borrowMargin, getMaxBorrowable } from '@/lib/margin/binance-margin';
import { z } from 'zod';

// Request validation schema
const BorrowRequestSchema = z.object({
  asset: z.string().min(1, 'Asset is required'),
  amount: z.string().min(1, 'Amount is required'),
  apiKey: z.string().min(1, 'API key is required'),
  apiSecret: z.string().min(1, 'API secret is required'),
});

/**
 * POST /api/margin/borrow
 * Borrow assets for margin trading
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = BorrowRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: validation.error.message,
        },
        { status: 400 }
      );
    }

    const { asset, amount, apiKey, apiSecret } = validation.data;

    // Configure Binance margin client
    const configurationRestAPI = {
      apiKey: apiKey,
      apiSecret: apiSecret,
    };

    // Check max borrowable amount
    try {
      const maxBorrowData = await getMaxBorrowable(configurationRestAPI, asset);
      const maxBorrowAmount = parseFloat(maxBorrowData.amount || '0');
      const borrowAmount = parseFloat(amount);

      if (borrowAmount > maxBorrowAmount) {
        return NextResponse.json(
          {
            error: 'Borrow amount exceeds maximum borrowable',
            maxBorrowable: maxBorrowAmount,
            requested: borrowAmount,
          },
          { status: 400 }
        );
      }
    } catch (error) {
      console.warn('Could not check max borrowable:', error);
      // Continue with borrow attempt anyway
    }

    // Execute borrow on Binance
    const borrowResult = await borrowMargin(configurationRestAPI, asset, amount);

    return NextResponse.json({
      success: true,
      message: `Successfully borrowed ${amount} ${asset}`,
      data: borrowResult,
    });
  } catch (error: unknown) {
    console.error('Error borrowing margin:', error);

    let errorMessage = error instanceof Error ? error.message : 'Failed to borrow margin';

    // Check for common Binance error messages
    if (errorMessage.includes('-3022')) {
      errorMessage = 'Maximum borrow amount exceeded for this asset. Your collateral is insufficient to borrow this amount.';
    } else if (errorMessage.includes('-3020')) {
      errorMessage = 'Borrow amount must be positive';
    } else if (errorMessage.includes('Borrow amount has exceed your maximum borrow amount')) {
      errorMessage = 'Borrow amount exceeds your maximum borrowing limit based on current collateral.';
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

