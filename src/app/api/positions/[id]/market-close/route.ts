import db from "@/db";
import { NextRequest, NextResponse } from "next/server";
import { Action } from "@prisma/client";
import { validateSpotSignal } from "@/lib/fast-signal-bot/validator";
import { executeSpotTrade } from "@/lib/fast-signal-bot/executor";
import { validateMarginSignal } from "@/lib/fast-signal-bot/margin-validator";
import { executeMarginTrade } from "@/lib/fast-signal-bot/margin-executor";
import { getPriceBySymbol } from "@/lib/trading-utils";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const startTime = Date.now();
    try {
        const { id: positionId } = await params;
        const body = await request.json();
        const { userId } = body;

        console.log(`=== Manual Close Position: ${positionId} ===`);

        // 1. Get position with all related data
        const position = await db.position.findUnique({
            where: { id: positionId },
            include: {
                bot: {
                    include: {
                        portfolio: true,
                        exchange: true,
                    },
                },
            },
        });

        if (!position) {
            return NextResponse.json(
                { error: "Position not found" },
                { status: 404 }
            );
        }

        // 2. Validate position is open
        if (position.status !== "OPEN" && position.status !== "CLOSED" && position.status !== "CANCELED") {
            return NextResponse.json(
                { error: "Position is already closed", status: position.status },
                { status: 400 }
            );
        }

        // 3. Validate bot exists
        if (!position.bot) {
            return NextResponse.json(
                { error: "Bot not found for this position" },
                { status: 404 }
            );
        }

        // 5. Validate bot and exchange are active
        if (!position.bot.isActive) {
            return NextResponse.json(
                { error: "Bot is not active" },
                { status: 400 }
            );
        }

        if (!position.bot.exchange.isActive) {
            return NextResponse.json(
                { error: "Exchange is not active" },
                { status: 400 }
            );
        }

        // 6. Determine close action based on current holdings
        // LONG = We bought (BUY), so close with SELL (EXIT_LONG)
        // SHORT = We sold (SELL), so close with BUY (EXIT_SHORT)
        const closeAction = position.side === "LONG"
            ? Action.EXIT_LONG
            : Action.EXIT_SHORT;

        console.log(`[MarketClose] Position ${position.symbol} ${position.side} → Close with ${closeAction}`);

        // 7. Get current market price
        let currentPrice: number;
        try {
            const priceData = await getPriceBySymbol(
                {
                    apiKey: position.bot.exchange.apiKey,
                    apiSecret: position.bot.exchange.apiSecret,
                },
                position.symbol
            );
            currentPrice = parseFloat(priceData.price);
        } catch (error) {
            console.error("Failed to fetch current price:", error);
            return NextResponse.json(
                { error: "Failed to fetch current market price" },
                { status: 500 }
            );
        }

        console.log(`[MarketClose] Current price: ${currentPrice}`);

        // 8. Create synthetic signal for execution
        const syntheticSignal = {
            id: `manual-close-${positionId}`,
            botId: position.botId,
            action: closeAction,
            symbol: position.symbol,
            price: currentPrice,
            message: "Manual market close",
            processed: false,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        // 9. Execute based on account type
        if (position.accountType === "SPOT") {
            // SPOT execution
            const validation = await validateSpotSignal({
                bot: position.bot as any,
                signal: syntheticSignal as any,
                currentPrice,
            });

            console.log(`[MarketClose] SPOT Validation: ${validation.success ? "Success" : "Failed"}`, validation.error || "");

            const execution = await executeSpotTrade({
                bot: position.bot as any,
                signal: syntheticSignal as any,
                validation,
            });

            console.log(`[MarketClose] SPOT Execution: ${execution.success ? "Success" : "Failed"}`, execution.error || "");

            if (execution.success) {
                const executionTime = Date.now() - startTime;
                return NextResponse.json({
                    success: true,
                    message: `Position closed successfully (${executionTime}ms)`,
                    orderId: execution.orderId,
                    positionId: position.id,
                    executionTime,
                });
            } else {
                return NextResponse.json(
                    {
                        success: false,
                        error: execution.error || "Execution failed",
                        validationError: validation.error,
                    },
                    { status: 400 }
                );
            }
        } else if (position.accountType === "MARGIN") {
            // MARGIN execution
            const validation = await validateMarginSignal({
                bot: position.bot as any,
                signal: syntheticSignal as any,
                currentPrice,
            });

            console.log(`[MarketClose] MARGIN Validation: ${validation.success ? "Success" : "Failed"}`, validation.error || "");

            const execution = await executeMarginTrade({
                bot: position.bot as any,
                signal: syntheticSignal as any,
                validation,
            });

            console.log(`[MarketClose] MARGIN Execution: ${execution.success ? "Success" : "Failed"}`, execution.error || "");

            if (execution.success) {
                const executionTime = Date.now() - startTime;
                return NextResponse.json({
                    success: true,
                    message: `Position closed successfully (${executionTime}ms)`,
                    orderId: execution.orderId,
                    positionId: position.id,
                    executionTime,
                });
            } else {
                return NextResponse.json(
                    {
                        success: false,
                        error: execution.error || "Execution failed",
                        validationError: validation.error,
                    },
                    { status: 400 }
                );
            }
        } else {
            return NextResponse.json(
                { error: `Unsupported account type: ${position.accountType}` },
                { status: 400 }
            );
        }
    } catch (error) {
        console.error("Error closing position:", error);
        return NextResponse.json(
            {
                error: "Internal server error",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}
