import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import db from "@/db";
import { PositionStatus, Side } from "@prisma/client";

// Force close all open positions for a user
// Updates database only, no exchange API calls
export async function forceCloseAllPositions(userId: string): Promise<{
    success: boolean;
    closedCount: number;
    message?: string;
    error?: string;
}> {
    try {
        // 1. Find all OPEN positions for user
        const openPositions = await db.position.findMany({
            where: {
                portfolio: {
                    userId: userId,
                },
                status: PositionStatus.OPEN,
            },
        });

        if (openPositions.length === 0) {
            return {
                success: true,
                closedCount: 0,
                message: "No open positions found to close.",
            };
        }

        let closedCount = 0;

        // 2. Close each position
        for (const position of openPositions) {
            // Determine exit price (use current price if available, otherwise entry price)
            // If currentPrice is null, fallback to entryPrice to avoid PnL spikes/errors
            const exitPrice = position.currentPrice ?? position.entryPrice;

            // Calculate PnL
            let pnl = 0;
            if (position.side === Side.LONG) {
                pnl = (exitPrice - position.entryPrice) * position.quantity;
            } else {
                pnl = (position.entryPrice - exitPrice) * position.quantity;
            }

            const exitValue = exitPrice * position.quantity;

            // Calculate PnL percent
            const pnlPercent = position.entryValue > 0
                ? (pnl / position.entryValue) * 100
                : 0;

            // Update position in database
            await db.position.update({
                where: { id: position.id },
                data: {
                    status: PositionStatus.CLOSED,
                    exitPrice: exitPrice,
                    exitValue: exitValue,
                    pnl: pnl,
                    pnlPercent: pnlPercent,
                    closedAt: new Date(),
                    // We don't have a notes field on Position, so we can't add a note directly
                    // But the status change and closedAt timestamp will indicate it's closed
                },
            });

            closedCount++;
        }

        return {
            success: true,
            closedCount,
            message: `Successfully force closed ${closedCount} positions.`,
        };
    } catch (error) {
        console.error("Error force closing positions:", error);
        return {
            success: false,
            closedCount: 0,
            error: error instanceof Error ? error.message : "Unknown error occurred",
        };
    }
}
