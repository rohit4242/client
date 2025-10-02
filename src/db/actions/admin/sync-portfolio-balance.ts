"use server";

import { isAdmin } from "@/lib/auth-utils";
import db from "@/db";

/**
 * Sync portfolio balance from the active exchange
 * This should be called when an exchange is added or activated
 */
export async function syncPortfolioBalance(userId: string): Promise<boolean> {
  try {
    const admin = await isAdmin();

    if (!admin) {
      throw new Error("Unauthorized: Admin access required");
    }

    // Get user's portfolio
    const portfolio = await db.portfolio.findFirst({
      where: {
        userId,
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
      return false;
    }

    // Get the first active exchange
    const activeExchange = portfolio.exchanges.find(e => e.isActive) || portfolio.exchanges[0];

    if (!activeExchange) {
      console.log("No active exchange found for portfolio:", portfolio.id);
      return false;
    }

    // Get the total value from the exchange
    const totalValue = parseFloat(activeExchange.totalValue) || 0;

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

      console.log(`Portfolio balance synced for user ${userId}: $${totalValue}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error("Error syncing portfolio balance:", error);
    return false;
  }
}

