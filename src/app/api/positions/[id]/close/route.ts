import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import db from "@/db";
import { placeCloseOrder } from "@/db/actions/order/create-order";
import { closePosition } from "@/db/actions/position/close-position";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// Market Close Position - Execute opposite order (Buy -> Sell, Sell -> Buy)
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id } = await params;

    console.log("body", body);
    console.log("positionId", id);
    console.log("selectedUser", body.userId);

    const { userId } = body;

    const targetUserId = userId || session.user.id;

    // Find the position with user account and bot (if any)
    const position = await db.position.findUnique({
      where: { id: id, portfolio: { userId: targetUserId } },
      include: {
        portfolio: {
          include: {
            exchanges: true,
          },
        },
        bot: true, // Include bot to get autoRepay setting
      },
    });

    if (!position) {
      return NextResponse.json(
        { error: "Position not found" },
        { status: 404 }
      );
    }

    if (position.status !== "OPEN") {
      return NextResponse.json(
        { error: "Position is not open" },
        { status: 400 }
      );
    }

    // Verify position belongs to the authenticated user
    if (position.portfolio.userId !== targetUserId) {
      return NextResponse.json(
        { error: "Unauthorized to close this position" },
        { status: 403 }
      );
    }

    // Get the active exchange for this user
    const activeExchange = position.portfolio.exchanges.find(ex => ex.isActive);
    
    if (!activeExchange) {
      return NextResponse.json(
        { error: "No active exchange found for this user" },
        { status: 400 }
      );
    }

    console.log("Using exchange:", activeExchange.name);

    const configurationRestAPI = {
      apiKey: activeExchange.apiKey,
      apiSecret: activeExchange.apiSecret,
    };

    // Place close order on Binance (opposite side)
    const closeOrderResult = await placeCloseOrder(
      {
        symbol: position.symbol,
        side: position.side,
        quantity: Number(position.quantity.toFixed(8)),
        accountType: position.accountType || "SPOT", // Pass account type to determine API
        autoRepay: position.bot?.autoRepay ?? true, // Use bot's autoRepay setting, default to true
      },
      configurationRestAPI
    );

    console.log("Close order result:", closeOrderResult);

    if (!closeOrderResult.success) {
      return NextResponse.json(
        {
          error: closeOrderResult.message || "Failed to place close order",
          code: closeOrderResult.code,
          errors: closeOrderResult.errors,
          warnings: closeOrderResult.warnings,
        },
        { status: 400 }
      );
    }

    // Update position with close order details
    const closePositionResult = await closePosition({
      positionId: position.id,
      binanceResponse: closeOrderResult.data,
    });

    console.log("Position close result:", closePositionResult);

    // Recalculate portfolio stats after successful close
    if (closePositionResult.success && closePositionResult.status === "CLOSED") {
      try {
        const { recalculatePortfolioStatsInternal } = await import("@/db/actions/portfolio/recalculate-stats");
        await recalculatePortfolioStatsInternal(targetUserId);
        console.log("Portfolio stats updated after API position close");
      } catch (statsError) {
        console.error("Failed to update portfolio stats:", statsError);
        // Don't fail the close operation if stats update fails
      }
    }

    return NextResponse.json({
      success: true,
      message: "Position closed successfully",
      position: {
        id: closePositionResult.positionId,
        status: closePositionResult.status,
        pnl: closePositionResult.pnl,
        pnlPercent: closePositionResult.pnlPercent,
      },
      closeOrder: closeOrderResult.data,
    });

  } catch (error) {
    console.error("Error closing position:", error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}