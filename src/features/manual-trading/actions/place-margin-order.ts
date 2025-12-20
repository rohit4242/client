/**
 * Manual Trading Feature - Place Margin Order Action
 * 
 * Server action for placing margin trading orders
 * Wraps the unified trading engine with margin-specific configuration
 */

"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/session";
import {
    handleServerError,
    successResult,
    type ServerActionResult
} from "@/lib/validation/error-handler";
import { executeTradingRequest } from "@/features/trading/engine";
import type { TradingRequest, TradingResult } from "@/features/trading/types/trading.types";
import { PlaceMarginOrderSchema, type PlaceMarginOrderInput } from "../schemas/margin-order.schema";
import { db } from "@/lib/db/client";

/**
 * Place margin order action (Manual Trading)
 * 
 * Used by manual trading UI to place margin orders
 * 
 * @param input - Margin order input data
 * @returns Trading result with position and order IDs
 */
export async function placeMarginOrderAction(
    input: unknown
): Promise<ServerActionResult<TradingResult>> {
    try {
        const session = await requireAuth();

        // Validate input with Zod
        const validated = PlaceMarginOrderSchema.parse(input);

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

        // Get portfolio
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
                ...validated.order,
                accountType: "MARGIN", // Explicitly set for margin trading
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
        revalidatePath("/manual-trading");
        revalidatePath("/positions");
        revalidatePath("/portfolio");
        revalidatePath("/agent/manual-trading");

        return successResult(result);
    } catch (error) {
        return handleServerError(error, "Failed to place margin order");
    }
}
