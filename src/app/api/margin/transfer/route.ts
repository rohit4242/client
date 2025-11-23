import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { transferAsset } from '@/lib/asset-transfer';
import { z } from 'zod';

// Request validation schema
const TransferRequestSchema = z.object({
  asset: z.string().min(1, 'Asset is required'),
  amount: z.string().min(1, 'Amount is required'),
  direction: z.enum(['toMargin', 'toSpot']),
  apiKey: z.string().min(1, 'API key is required'),
  apiSecret: z.string().min(1, 'API secret is required'),
});

/**
 * POST /api/margin/transfer
 * Transfer assets between spot and margin accounts using Universal Transfer API
 * 
 * Note: API key must have "Permits Universal Transfer" option enabled
 * @see https://developers.binance.com/docs/wallet/asset/user-universal-transfer
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
    const validation = TransferRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: validation.error.message,
        },
        { status: 400 }
      );
    }

    const { asset, amount, direction, apiKey, apiSecret } = validation.data;

    // Configure Binance API client
    const configurationRestAPI = {
      apiKey: apiKey,
      apiSecret: apiSecret,
    };

    // Determine transfer type for Universal Transfer API
    // MAIN_MARGIN: Spot account transfer to Margin (cross) account
    // MARGIN_MAIN: Margin (cross) account transfer to Spot account
    const transferType = direction === 'toMargin' ? 'MAIN_MARGIN' : 'MARGIN_MAIN';

    // Execute transfer on Binance using Universal Transfer API
    const transferResult = await transferAsset(
      configurationRestAPI,
      asset,
      amount,
      transferType as 'MAIN_MARGIN' | 'MARGIN_MAIN'
    );

    const directionText =
      direction === 'toMargin' ? 'Spot to Margin' : 'Margin to Spot';

    return NextResponse.json({
      success: true,
      message: `Successfully transferred ${amount} ${asset} (${directionText})`,
      data: transferResult,
    });
  } catch (error: unknown) {
    console.error('Error transferring assets:', error);

    let errorMessage = error instanceof Error ? error.message : 'Failed to transfer assets';

    // Check for common Binance error messages and codes
    if (errorMessage.includes('Balance is not enough') || errorMessage.includes('-2010')) {
      errorMessage = 'Insufficient balance for transfer. Please check your account balance.';
    } else if (errorMessage.includes('-3020')) {
      errorMessage = 'Transfer amount must be positive';
    } else if (errorMessage.includes('-3021')) {
      errorMessage = 'Invalid transfer operation';
    } else if (errorMessage.includes('API-key format invalid')) {
      errorMessage = 'Invalid API key configuration. Please check your API settings.';
    } else if (errorMessage.includes('Permits Universal Transfer')) {
      errorMessage = 'API key does not have "Permits Universal Transfer" permission enabled. Please enable it in your Binance API settings.';
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

