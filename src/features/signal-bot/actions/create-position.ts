/**
 * Create Position Server Action
 * 
 * Manually creates a position for a signal bot.
 */

"use server";

import db from "@/db";
import { getUserWithRole } from "@/lib/auth-utils";
import { getSelectedUser } from "@/lib/selected-user-server";
import {
    CreatePositionInputSchema,
    type CreatePositionInput,
    type CreatePositionResult
} from "../schemas/bot.schema";
import { placeOrder } from "@/db/actions/order/create-order";
import { updatePosition } from "@/db/actions/position/update-position";
import {
    calculatePositionQuantity,
    adjustQuantityToConstraints,
    validateOrderBalance,
    calculateExitPrices,
} from "@/lib/utils";
import {
    getBalance,
    getPriceBySymbol,
    tradingPairInfo,
} from "@/lib/trading-utils";
import { extractTradingConstraints } from "@/lib/trading-constraints";

/**
 * Create a manual position for a bot
 */
export async function createPosition(
    input: CreatePositionInput
): Promise<CreatePositionResult> {
    try {
        const user = await getUserWithRole();
        if (!user) throw new Error("Unauthorized");

        // Validate input
        const validatedData = CreatePositionInputSchema.safeParse(input);
        if (!validatedData.success) {
            throw new Error(`Invalid input: ${validatedData.error.issues.map(e => e.message).join(", ")}`);
        }

        const { botId, side, symbol, customQuantity } = validatedData.data;

        // Check if admin is using selected user
        const selectedUser = await getSelectedUser();
        const targetUserId = selectedUser?.id || user.id;

        // Get user portfolio
        const portfolio = await db.portfolio.findFirst({
            where: { userId: targetUserId },
        });

        if (!portfolio) throw new Error("User account not found");

        // Get signal bot
        const signalBot = await db.bot.findFirst({
            where: { id: botId, portfolioId: portfolio.id },
            include: { exchange: true },
        });

        if (!signalBot) throw new Error("Signal bot not found");
        if (!signalBot.isActive) throw new Error("Signal bot is not active");

        // Validate symbol
        if (!signalBot.symbols.includes(symbol)) {
            throw new Error(`Symbol ${symbol} is not configured for this bot.`);
        }

        // Exchange config
        const config = {
            apiKey: signalBot.exchange.apiKey,
            apiSecret: signalBot.exchange.apiSecret,
        };

        // Get market data
        const [priceData, exchangeInfo] = await Promise.all([
            getPriceBySymbol(config, symbol),
            tradingPairInfo(config, symbol),
        ]);

        const currentPrice = parseFloat((priceData as any).price);
        if (!currentPrice || currentPrice <= 0) throw new Error("Unable to fetch current price");

        const constraints = extractTradingConstraints(exchangeInfo, symbol);
        if (!constraints) throw new Error("Unable to get trading constraints");

        // Get balance
        const allBalances = await getBalance(config);
        if (!allBalances || allBalances.length === 0) throw new Error("No balances found");

        // Calculate quantity
        const rawQuantity = calculatePositionQuantity(
            side as any,
            0, // We rely on signalBot.tradeAmount for manual trigger if not base balance provided
            currentPrice,
            signalBot.tradeAmount,
            customQuantity
        );

        const quantity = adjustQuantityToConstraints(rawQuantity, currentPrice, constraints);

        // Calculate exit prices
        const { stopLossPrice, takeProfitPrice } = calculateExitPrices(
            side as any,
            currentPrice,
            signalBot.stopLoss,
            signalBot.takeProfit
        );

        // Create position in DB
        const isMargin = signalBot.accountType === "MARGIN";
        const dbSide = side === "Long" ? "LONG" : "SHORT";
        const entryValue = currentPrice * quantity;

        const position = await db.position.create({
            data: {
                portfolioId: portfolio.id,
                botId: signalBot.id,
                symbol,
                side: dbSide,
                status: "OPEN",
                accountType: isMargin ? "MARGIN" : "SPOT",
                marginType: isMargin ? "CROSS" : null,
                entryPrice: currentPrice,
                quantity,
                entryValue,
                currentPrice: currentPrice,
                type: "MARKET",
                leverage: signalBot.leverage || 1,
                sideEffectType: isMargin ? (signalBot.sideEffectType || "NO_SIDE_EFFECT") : "NO_SIDE_EFFECT",
                stopLoss: stopLossPrice,
                takeProfit: takeProfitPrice,
                createdAt: new Date(),
                source: "BOT",
            },
        });

        const orderSide = side === "Long" ? "BUY" : "SELL";
        const order = await db.order.create({
            data: {
                positionId: position.id,
                portfolioId: portfolio.id,
                orderId: "", // Will be updated after exchange execution
                symbol,
                type: "ENTRY",
                side: orderSide,
                orderType: "MARKET",
                accountType: isMargin ? "MARGIN" : "SPOT",
                marginType: isMargin ? "CROSS" : null,
                sideEffectType: isMargin ? (signalBot.sideEffectType || "NO_SIDE_EFFECT") : "NO_SIDE_EFFECT",
                price: currentPrice,
                quantity,
                value: entryValue,
                status: "NEW",
                fillPercent: 0,
                pnl: 0,
            },
        });

        // Execute on exchange
        const result = await placeOrder(
            {
                symbol,
                side: orderSide,
                type: "MARKET",
                quantity: quantity.toString(),
            },
            config
        );

        if (result.success && result.data) {
            await updatePosition({
                positionId: position.id,
                orderId: order.id,
                binanceResponse: result.data,
            });

            // Update bot stats
            await db.bot.update({
                where: { id: signalBot.id },
                data: { totalTrades: { increment: 1 } },
            });

            // Recalculate stats async
            import("@/db/actions/portfolio/recalculate-stats").then(({ recalculatePortfolioStatsInternal }) => {
                recalculatePortfolioStatsInternal(targetUserId).catch(console.error);
            });

            return {
                success: true,
                message: `${side} position created for ${symbol}`,
                position: {
                    id: position.id,
                    symbol: position.symbol,
                    side: position.side,
                    entryPrice: position.entryPrice,
                    quantity: position.quantity,
                    entryValue: position.entryValue,
                    stopLoss: position.stopLoss,
                    takeProfit: position.takeProfit,
                    status: position.status,
                    entryTime: position.createdAt,
                }
            };
        } else {
            // Cleanup
            await db.position.delete({ where: { id: position.id } }).catch(console.error);
            await db.order.delete({ where: { id: order.id } }).catch(console.error);
            throw new Error(result.message || "Failed to place order on exchange");
        }

    } catch (error) {
        console.error("Error creating manual position:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to create position",
        };
    }
}
