import { NextRequest, NextResponse } from "next/server";
import { syncPortfolioBalance } from "@/db/actions/admin/sync-portfolio-balance";
import { isAdmin } from "@/lib/auth-utils";

/**
 * POST /api/admin/sync-balance/[userId]
 * Manually sync a customer's portfolio balance from their exchange
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const admin = await isAdmin();

    if (!admin) {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required" },
        { status: 401 }
      );
    }

    const { userId } = await params;

    const success = await syncPortfolioBalance(userId);

    if (success) {
      return NextResponse.json({
        success: true,
        message: "Portfolio balance synced successfully",
      });
    } else {
      return NextResponse.json({
        success: false,
        message: "Failed to sync portfolio balance or balance already set",
      });
    }
  } catch (error) {
    console.error("Error syncing portfolio balance:", error);
    return NextResponse.json(
      {
        error: "Failed to sync portfolio balance",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

