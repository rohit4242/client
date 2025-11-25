import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import db from "@/db";

/**
 * POST /api/customer/sync-balance
 * Sync the customer's portfolio balance from their exchange
 */
export async function POST() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's portfolio
    const portfolio = await db.portfolio.findFirst({
      where: {
        userId: session.user.id,
      },
      include: {
        exchanges: {
          where: {
            isActive: true,
          },
        },
      },
    });

    if (!portfolio) {
      return NextResponse.json(
        { error: "Portfolio not found" },
        { status: 404 }
      );
    }

    // Get the first active exchange
    const activeExchange =
      portfolio.exchanges.find((e) => e.isActive) || portfolio.exchanges[0];

    if (!activeExchange) {
      return NextResponse.json(
        { error: "No active exchange found. Please add an exchange first." },
        { status: 400 }
      );
    }

    // Get the total value from the exchange
    const totalValue = activeExchange.totalValue || 0;

    // Only update if initialBalance is 0 (not yet set)
    if (portfolio.initialBalance === 0 && totalValue > 0) {
      await db.portfolio.update({
        where: {
          id: portfolio.id,
        },
        data: {
          initialBalance: totalValue,
          currentBalance: totalValue,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Portfolio balance synced: $${totalValue}`,
        initialBalance: totalValue,
      });
    }

    return NextResponse.json({
      success: false,
      message: "Balance already initialized or no balance available",
      initialBalance: portfolio.initialBalance,
    });
  } catch (error) {
    console.error("Error syncing customer balance:", error);
    return NextResponse.json(
      {
        error: "Failed to sync portfolio balance",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
