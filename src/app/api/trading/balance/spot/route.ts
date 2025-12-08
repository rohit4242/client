import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { handleApiError, ApiError, ErrorCodes } from "@/lib/api-error-handler";
import { createSuccessResponse } from "@/types/api";
import { Spot } from "@binance/spot";
import { z } from "zod";

const SpotBalanceRequestSchema = z.object({
  asset: z.string().nullish(),
  apiKey: z.string().min(1, "API key is required"),
  apiSecret: z.string().min(1, "API secret is required"),
});

/**
 * POST /api/trading/balance/spot
 * Fetch spot balance for a specific asset
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      throw new ApiError(401, ErrorCodes.UNAUTHORIZED, "Unauthorized");
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = SpotBalanceRequestSchema.safeParse(body);

    if (!validation.success) {
      throw new ApiError(
        400,
        ErrorCodes.VALIDATION_ERROR,
        "Invalid request data",
        validation.error.issues
      );
    }

    const { asset, apiKey, apiSecret } = validation.data;

    // Fetch account balances from Binance
    const client = new Spot({
      configurationRestAPI: {
        apiKey,
        apiSecret,
      },
    });

    const response = await client.restAPI.getAccount({
      omitZeroBalances: true,
    });

    const { balances } = await response.data();


    // Find the requested asset or return all non-zero balances
    if (asset) {
      const assetBalance = balances?.find((balance) => balance.asset === asset);

      if (!assetBalance) {
        // Return zero balance if asset not found
        return NextResponse.json(
          createSuccessResponse({
            asset,
            free: "0",
            locked: "0",
          }),
          { status: 200 }
        );
      }

      return NextResponse.json(
        createSuccessResponse(assetBalance),
        { status: 200 }
      );
    } else {
      // Return all non-zero balances
      // The Binance SDK 'omitZeroBalances: true' option already handles filtering
      return NextResponse.json(
        createSuccessResponse(balances || []),
        { status: 200 }
      );
    }
  } catch (error) {
    return handleApiError(error);
  }
}

