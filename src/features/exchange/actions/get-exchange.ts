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
import { getSelectedUser } from "@/lib/selected-user-server";

/**
 * Get exchange by ID
 * Ensures user owns the exchange
 */
export const getExchange = cache(async (id: string): Promise<GetExchangeResult> => {
    try {
       const selectedUser = await getSelectedUser();
       if (!selectedUser) {
            throw new Error("Selected user not found");
        }

        // Fetch exchange with portfolio check
        const exchange = await db.exchange.findFirst({
            where: {
                id,
                portfolio: {
                    userId: selectedUser.id,
                },
            },
        });

        assertExists(exchange, "Exchange not found");

        return { exchange: toExchangeClient(exchange) };
    } catch (error) {
        throw error;
    }
});
