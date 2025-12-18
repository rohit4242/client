/**
 * Get Position Server Action
 * 
 * Fetches a single position by ID with all related data.
 */

"use server";

import { cache } from "react";
import { db } from "@/lib/db/client";
import { requireAuth } from "@/lib/auth/session";
import { GetPositionInputSchema, enrichPositionWithCalculations, toPositionClient, type GetPositionInput, type GetPositionResult } from "../schemas/position.schema";
import { assertExists } from "@/lib/validation/error-handler";

/**
 * Get position by ID
 * Ensures user owns the position
 * Cached for the duration of the request
 */
export const getPosition = cache(async (
    input: GetPositionInput
): Promise<GetPositionResult> => {
    try {
        const session = await requireAuth();

        // Validate input
        const validated = GetPositionInputSchema.parse(input);
        const { id } = validated;

        // Fetch position with ownership check
        const position = await db.position.findFirst({
            where: {
                id,
                portfolio: {
                    userId: session.id,
                },
            },
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
                orders: {
                    orderBy: {
                        createdAt: "desc",
                    },
                },
            },
        });

        if (!position) {
            return { position: null };
        }

        // Transform to client format with calculations
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

        const enrichedPosition = enrichPositionWithCalculations(
            clientPosition,
            exchange,
            position.bot
        );

        return { position: enrichedPosition };
    } catch (error) {
        console.error("Error fetching position:", error);
        throw error;
    }
});
