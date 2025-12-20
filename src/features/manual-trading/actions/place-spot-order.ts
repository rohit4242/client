/**
 * Manual Trading Feature - Place Spot Order Action
 * 
 * Server action for placing spot trading orders
 * Wraps the unified trading engine with spot-specific configuration
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
import { PlaceSpotOrderSchema, type PlaceSpotOrderInput } from "../schemas/spot-order.schema";
import { db } from "@/lib/db/client";

/**
 * Place spot order action (Manual Trading)
 * 
 * Used by manual trading UI to place spot orders
 * 
 * @param input - Spot order input data
 * @returns Trading result with position and order IDs
 */
export async function placeSpotOrderAction(
    input: unknown
): Promise<ServerActionResult<TradingResult>> {
    try {
        const session = await requireAuth();

        // Validate input with Zod
        const validated = PlaceSpotOrderSchema.parse(input);

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
                accountType: "SPOT", // Explicitly set for spot trading
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
        return handleServerError(error, "Failed to place spot order");
    }
}
