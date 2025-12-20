/**
 * Trading Action - Place Order (Manual Trading)
 * 
 * Server action for manual trading UI
 * Uses the unified trading engine
 */

"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/session";
import { handleServerError, successResult, type ServerActionResult } from "@/lib/validation/error-handler";
import { executeTradingRequest } from "../engine";
import type { TradingRequest, TradingResult } from "../types/trading.types";
import { PlaceOrderInputSchema } from "../schemas/order.schema";
import { db } from "@/lib/db/client";

/**
 * Place order action (Manual Trading)
 * 
 * Used by manual trading UI to place orders
 * 
 * @param input - Order input data
 * @returns Trading result with position and order IDs
 */
export async function placeOrderAction(
    input: unknown
): Promise<ServerActionResult<TradingResult>> {
    try {
        const session = await requireAuth();

        // Validate input with Zod
        const validated = PlaceOrderInputSchema.parse(input);

        // Get user's exchange
        const exchange = await db.exchange.findFirst({
            where: {
                id: validated.exchangeId,
                portfolio: {
                    userId: session.id,
                },
            },
        });

        if (!exchange) {
            return {
                success: false,
                error: "Exchange not found or access denied",
            };
        }

        //Get portfolio
        const portfolio = await db.portfolio.findFirst({
            where: {
                userId: session.id,
            },
        });

        if (!portfolio) {
            return {
                success: false,
                error: "Portfolio not found",
            };
        }

        // Build trading request
        const tradingRequest: TradingRequest = {
            userId: session.id,
            portfolioId: portfolio.id,
            source: "MANUAL",
            exchange: {
                id: exchange.id,
                apiKey: exchange.apiKey,
                apiSecret: exchange.apiSecret,
            },
            order: {
                side: validated.side,
                symbol: validated.symbol,
                type: validated.type,
                accountType: validated.accountType,
                quantity: validated.quantity,
                quoteOrderQty: validated.quoteOrderQty,
                price: validated.price,
                timeInForce: validated.timeInForce,
                sideEffectType: validated.sideEffectType,
                stopLoss: validated.stopLoss,
                takeProfit: validated.takeProfit,
            },
        };

        // Execute via unified trading engine
        const result = await executeTradingRequest(tradingRequest);

        if (!result.success) {
            return {
                success: false,
                error: result.error || "Unknown error",
                details: result.validationErrors,
            };
        }

        // Revalidate paths
        revalidatePath("/trading");
        revalidatePath("/positions");
        revalidatePath("/portfolio");
        revalidatePath("/agent/trading");
        revalidatePath("/agent/positions");

        return successResult(result);
    } catch (error) {
        return handleServerError(error, "Failed to place order");
    }
}
