import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import db from '@/db';
import { repayMargin } from '@/lib/binance-margin';
import { z } from 'zod';

// Request validation schema
const RepayRequestSchema = z.object({
  asset: z.string().min(1, 'Asset is required'),
  amount: z.string().min(1, 'Amount is required'),
  apiKey: z.string().min(1, 'API key is required'),
  apiSecret: z.string().min(1, 'API secret is required'),
});

/**
 * POST /api/margin/repay
 * Repay borrowed assets
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
    const validation = RepayRequestSchema.safeParse(body);

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

    // Execute repay on Binance
    const repayResult = await repayMargin(configurationRestAPI, asset, amount);

    return NextResponse.json({
      success: true,
      message: `Successfully repaid ${amount} ${asset}`,
      data: repayResult,
    });
  } catch (error: unknown) {
    console.error('Error repaying margin:', error);

    let errorMessage = error instanceof Error ? error.message : 'Failed to repay margin';

    // Check for common Binance error messages
    if (errorMessage.includes('Balance is not enough') || errorMessage.includes('-2010')) {
      errorMessage = 'Insufficient total margin account value to repay. Binance requires enough collateral value to cover the repayment. Please ensure you have sufficient assets in your margin account.';
    } else if (errorMessage.includes('-3020')) {
      errorMessage = 'Repay amount must be positive';
    } else if (errorMessage.includes('-3021')) {
      errorMessage = 'No debt to repay for this asset';
    } else if (errorMessage.includes('Margin account does not have enough')) {
      errorMessage = 'Total margin account value is insufficient. Binance will use available assets (USDT, etc.) but requires sufficient total value.';
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details: error instanceof Error ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

