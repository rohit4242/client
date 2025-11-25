import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import db from '@/db';
import { getMaxBorrowable, getMarginAccount } from '@/lib/margin/binance-margin';
import { z } from 'zod';

// Request validation schema
const MaxBorrowRequestSchema = z.object({
  asset: z.string().min(1, 'Asset is required'),
  apiKey: z.string().min(1, 'API key is required'),
  apiSecret: z.string().min(1, 'API secret is required'),
});

/**
 * POST /api/margin/max-borrow
 * Get maximum borrowable amount for an asset
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

    const validation = MaxBorrowRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: validation.error.message,
        }, { status: 400 });
    }

    // Configure Binance margin client
    const configurationRestAPI = {
      apiKey: validation.data.apiKey,
      apiSecret: validation.data.apiSecret,
    };

    // Get max borrowable amount
    const maxBorrowData = await getMaxBorrowable(configurationRestAPI, validation.data.asset);
    // Get current margin account to find borrowed amount
    const marginAccount = await getMarginAccount(configurationRestAPI);
    const userAsset = marginAccount.userAssets?.find((a: any) => a.asset === validation.data.asset);
    
    const borrowed = userAsset ? parseFloat(userAsset.borrowed || '0') : 0;
    const interest = userAsset ? parseFloat(userAsset.interest || '0') : 0;
    const totalOwed = borrowed + interest;

    return NextResponse.json({
      success: true,
      data: {
        asset: validation.data.asset,
        maxBorrowable: maxBorrowData.amount || '0',
        currentBorrowed: borrowed.toString(),
        interest: interest.toString(),
        totalOwed: totalOwed.toString(),
      },
    });
  } catch (error: unknown) {
    console.error('Error fetching max borrow:', error);

    const errorMessage =
      error instanceof Error ? error.message : 'Failed to fetch max borrow';

    return NextResponse.json(
      {
        error: errorMessage,
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

