import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import db from '@/db';
import { getMarginAccount } from '@/lib/margin/binance-margin';
import { calculateMarginLevel, getRiskLevel, isLiquidationRisk } from '@/lib/margin/margin-utils';

/**
 * GET /api/margin/account
 * Fetch cross margin account information
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
        headers: await headers(),
      });
    
      if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    
      const body = await request.json();
      const { apiKey, apiSecret } = body;
    
      const configurationRestAPI = {
        apiKey: apiKey,
        apiSecret: apiSecret,
      };
    

    // Fetch margin account details from Binance
    const marginAccount = await getMarginAccount(configurationRestAPI);

    // Calculate margin statistics
    const totalAssets = parseFloat(marginAccount.totalAssetOfBtc || '0');
    const totalBorrowed = parseFloat(marginAccount.totalLiabilityOfBtc || '0');
    const marginLevel = calculateMarginLevel(totalAssets, totalBorrowed);
    const riskLevel = getRiskLevel(marginLevel);
    const liquidationRisk = isLiquidationRisk(marginLevel);

    // Return enriched account data
    return NextResponse.json({
      success: true,
      data: {
        ...marginAccount,
        stats: {
          totalAssets,
          totalBorrowed,
          marginLevel,
          riskLevel,
          isLiquidationRisk: liquidationRisk,
        },
      },
    });
  } catch (error: unknown) {
    console.error('Error fetching margin account:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch margin account';
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

