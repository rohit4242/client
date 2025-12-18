/**
 * Get Orders Server Action
 * 
 * Fetches orders with optional filters.
 * Supports filtering by position, symbol, status, and type.
 */

"use server";

import { cache } from "react";
import { db } from "@/lib/db/client";
import { requireAuth } from "@/lib/auth/session";
import { getSelectedUser } from "@/lib/selected-user-server";
import { GetOrdersInputSchema, enrichOrderWithPosition, toOrderClient, type GetOrdersInput, type GetOrdersResult } from "../schemas/order.schema";

/**
 * Get orders with filters
 * Cached for the duration of the request
 */
export const getOrders = cache(async (
    input: GetOrdersInput = {}
): Promise<GetOrdersResult> => {
    try {
        const session = await requireAuth();

        // Validate input
        const validated = GetOrdersInputSchema.parse(input);
        const { positionId, symbol, status, type, limit, userId } = validated;

        // Check if admin is using selected user
        const selectedUser = await getSelectedUser();
        const targetUserId = userId || selectedUser?.id || session.id;

        // Build where clause
        const where = {
            portfolio: {
                userId: targetUserId,
            },
            ...(positionId && { positionId }),
            ...(symbol && { symbol }),
            ...(status && { status }),
            ...(type && { type }),
        };

        // Fetch orders with position info
        const [orders, total] = await Promise.all([
            db.order.findMany({
                where,
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
                orderBy: {
                    createdAt: "desc",
                },
                ...(limit && { take: limit }),
            }),
            db.order.count({ where }),
        ]);

        // Transform to client format
        const enrichedOrders = orders.map((order) => {
            const clientOrder = toOrderClient(order);
            return enrichOrderWithPosition(clientOrder, order.position);
        });

        return {
            orders: enrichedOrders,
            total,
        };
    } catch (error) {
        console.error("Error fetching orders:", error);
        return {
            orders: [],
            total: 0,
        };
    }
});

/**
 * Get orders for a specific position
 */
export const getOrdersByPosition = cache(async (
    positionId: string
): Promise<GetOrdersResult> => {
    return getOrders({ positionId });
});
