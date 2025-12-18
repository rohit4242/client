/**
 * Get Single Exchange Server Action
 * 
 * Fetches a specific exchange by ID.
 */

"use server";

import { cache } from "react";
import { db } from "@/lib/db/client";
import { requireAuth } from "@/lib/auth/session";
import { handleServerError, assertExists } from "@/lib/validation/error-handler";
import { toExchangeClient, type GetExchangeResult } from "../schemas/exchange.schema";

/**
 * Get exchange by ID
 * Ensures user owns the exchange
 */
export const getExchange = cache(async (id: string): Promise<GetExchangeResult> => {
    try {
        const session = await requireAuth();

        // Fetch exchange with portfolio check
        const exchange = await db.exchange.findFirst({
            where: {
                id,
                portfolio: {
                    userId: session.id,
                },
            },
        });

        assertExists(exchange, "Exchange not found");

        return { exchange: toExchangeClient(exchange) };
    } catch (error) {
        throw error;
    }
});
