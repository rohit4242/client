/**
 * Get Positions Server Action
 * 
 * Fetches positions with optional filters.
 * Supports filtering by status, symbol, account type, and source.
 */

"use server";

import { cache } from "react";
import { db } from "@/lib/db/client";
import { getSelectedUser } from "@/lib/selected-user-server";
import { GetPositionsInputSchema, enrichPositionWithCalculations, toPositionClient, type GetPositionsInput, type GetPositionsResult } from "../schemas/position.schema";

/**
 * Get positions with filters
 * Cached for the duration of the request
 */
export const getPositions = cache(async (
    input: GetPositionsInput = {}
): Promise<GetPositionsResult> => {
    try {

        // Validate input
        const validated = GetPositionsInputSchema.parse(input);
        const { status, symbol, accountType, source, limit, userId, page = 1, pageSize = 20 } = validated;

        // Check if admin is using selected user
        const selectedUser = await getSelectedUser();
        const targetUserId = userId || selectedUser?.id;

        // Build where clause
        const where = {
            portfolio: {
                userId: targetUserId,
            },
            ...(status && {
                status: Array.isArray(status) ? { in: status } : status
            }),
            ...(symbol && { symbol }),
            ...(accountType && { accountType }),
            ...(source && { source }),
        };

        // Calculate pagination offset
        const skip = (page - 1) * pageSize;
        const take = limit || pageSize;

        // Fetch positions with related data
        const [positions, total] = await Promise.all([
            db.position.findMany({
                where,
                include: {
                    portfolio: {
                        include: {
                            exchanges: {
                                where: { isActive: true },
                                take: 1,
                            },
                        },
                    },
                    bot: {
                        select: {
                            id: true,
                            name: true,
                            description: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: "desc",
                },
                skip,
                take,
            }),
            db.position.count({ where }),
        ]);

        // Transform to client format with calculations
        const enrichedPositions = positions.map((position) => {
            const clientPosition = toPositionClient(position);
            const exchange = position.portfolio.exchanges[0]
                ? {
                    id: position.portfolio.exchanges[0].id,
                    name: position.portfolio.exchanges[0].name,
                }
                : {
                    id: "",
                    name: "UNKNOWN",
                };

            return enrichPositionWithCalculations(
                clientPosition,
                exchange,
                position.bot
            );
        });

        // Calculate pagination metadata
        const totalPages = Math.ceil(total / take);
        const hasNextPage = page < totalPages;
        const hasPreviousPage = page > 1;

        return {
            positions: enrichedPositions,
            total,
            page,
            pageSize: take,
            totalPages,
            hasNextPage,
            hasPreviousPage,
        };
    } catch (error) {
        console.error("Error fetching positions:", error);
        return {
            positions: [],
            total: 0,
            page: 1,
            pageSize: 20,
            totalPages: 0,
            hasNextPage: false,
            hasPreviousPage: false,
        };
    }
});

/**
 * Get open positions only
 */
export const getOpenPositions = cache(async (): Promise<GetPositionsResult> => {
    return getPositions({ status: "OPEN" });
});

/**
 * Get closed positions only
 */
export const getClosedPositions = cache(async (): Promise<GetPositionsResult> => {
    return getPositions({ status: "CLOSED" });
});
