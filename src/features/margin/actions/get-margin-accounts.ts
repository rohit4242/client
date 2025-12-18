/**
 * Get Margin Accounts Server Action
 * 
 * Fetches margin accounts with health calculations.
 */

"use server";

import { cache } from "react";
import { db } from "@/lib/db/client";
import { requireAuth } from "@/lib/auth/session";
import { getSelectedUser } from "@/lib/selected-user-server";
import { GetMarginAccountsInputSchema, enrichMarginAccountWithExchange, toMarginAccountClient, type GetMarginAccountsInput, type GetMarginAccountsResult } from "../schemas/margin.schema";

/**
 * Get margin accounts with filters
 * Cached for the duration of the request
 */
export const getMarginAccounts = cache(async (
    input: GetMarginAccountsInput = {}
): Promise<GetMarginAccountsResult> => {
    try {
        const session = await requireAuth();

        // Validate input
        const validated = GetMarginAccountsInputSchema.parse(input);
        const { exchangeId, userId } = validated;

        // Check if admin is using selected user
        const selectedUser = await getSelectedUser();
        const targetUserId = userId || selectedUser?.id || session.id;

        // Build where clause
        const where = {
            portfolio: {
                userId: targetUserId,
            },
            ...(exchangeId && { exchangeId }),
        };

        // Fetch margin accounts with exchange info
        const [accounts, total] = await Promise.all([
            db.marginAccount.findMany({
                where,
                include: {
                    exchange: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: "desc",
                },
            }),
            db.marginAccount.count({ where }),
        ]);

        // Transform to client format with calculations
        const enrichedAccounts = accounts.map((account) => {
            const clientAccount = toMarginAccountClient(account);
            return enrichMarginAccountWithExchange(clientAccount, account.exchange);
        });

        return {
            accounts: enrichedAccounts,
            total,
        };
    } catch (error) {
        console.error("Error fetching margin accounts:", error);
        return {
            accounts: [],
            total: 0,
        };
    }
});
