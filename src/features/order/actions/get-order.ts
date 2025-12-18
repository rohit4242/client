/**
 * Get Order Server Action
 * 
 * Fetches a single order by ID with all related data.
 */

"use server";

import { cache } from "react";
import { db } from "@/lib/db/client";
import { requireAuth } from "@/lib/auth/session";
import { GetOrderInputSchema, enrichOrderWithPosition, toOrderClient, type GetOrderInput, type GetOrderResult } from "../schemas/order.schema";

/**
 * Get order by ID
 * Ensures user owns the order
 * Cached for the duration of the request
 */
export const getOrder = cache(async (
    input: GetOrderInput
): Promise<GetOrderResult> => {
    try {
        const session = await requireAuth();

        // Validate input
        const validated = GetOrderInputSchema.parse(input);
        const { id } = validated;

        // Fetch order with ownership check
        const order = await db.order.findFirst({
            where: {
                id,
                portfolio: {
                    userId: session.id,
                },
            },
            include: {
                position: {
                    select: {
                        id: true,
                        symbol: true,
                        side: true,
                        status: true,
                    },
                },
            },
        });

        if (!order) {
            return { order: null };
        }

        // Transform to client format
        const clientOrder = toOrderClient(order);
        const enrichedOrder = enrichOrderWithPosition(clientOrder, order.position);

        return { order: enrichedOrder };
    } catch (error) {
        console.error("Error fetching order:", error);
        throw error;
    }
});
