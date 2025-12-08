import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { handleApiError, ApiError, ErrorCodes } from "@/lib/api-error-handler";
import { createSuccessResponse } from "@/types/api";
import { MarginTrading } from "@binance/margin-trading";
import { z } from "zod";

const MarginBalanceRequestSchema = z.object({
  asset: z.string().optional(),
  apiKey: z.string().min(1, "API key is required"),
  apiSecret: z.string().min(1, "API secret is required"),
});

/**
 * POST /api/trading/balance/margin
 * Fetch margin balance for a specific asset
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
    const validation = MarginBalanceRequestSchema.safeParse(body);

    if (!validation.success) {
      throw new ApiError(
        400,
        ErrorCodes.VALIDATION_ERROR,
        "Invalid request data",
        validation.error.issues
      );
    }

    const { asset, apiKey, apiSecret } = validation.data;

    // Fetch margin account from Binance
    const client = new MarginTrading({
      configurationRestAPI: {
        apiKey,
        apiSecret,
      },
    });

    const response = await client.restAPI.queryCrossMarginAccountDetails();
    const accountData = await response.data();

    if (asset) {
      // Find the requested asset in margin account
      const assetData = accountData.userAssets?.find((a: any) => a.asset === asset);

      if (!assetData) {
        // Return zero balances if asset not found
        return NextResponse.json(
          createSuccessResponse({
            asset,
            free: "0",
            locked: "0",
            borrowed: "0",
            interest: "0",
            netAsset: "0",
          }),
          { status: 200 }
        );
      }

      return NextResponse.json(
        createSuccessResponse({
          asset: assetData.asset,
          free: assetData.free || "0",
          locked: assetData.locked || "0",
          borrowed: assetData.borrowed || "0",
          interest: assetData.interest || "0",
          netAsset: assetData.netAsset || "0",
        }),
        { status: 200 }
      );
    } else {
      // Return all assets with non-zero values
      const activeAssets = accountData.userAssets?.filter((a: any) =>
        parseFloat(a.netAsset) !== 0 ||
        parseFloat(a.borrowed) !== 0 ||
        parseFloat(a.free) !== 0
      ).map((a: any) => ({
        asset: a.asset,
        free: a.free || "0",
        locked: a.locked || "0",
        borrowed: a.borrowed || "0",
        interest: a.interest || "0",
        netAsset: a.netAsset || "0",
      })) || [];

      return NextResponse.json(
        createSuccessResponse(activeAssets),
        { status: 200 }
      );
    }
  } catch (error) {
    return handleApiError(error);
  }
}

