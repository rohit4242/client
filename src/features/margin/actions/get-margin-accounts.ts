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
                orderBy: {
                    createdAt: "desc",
                },
            }),
            db.marginAccount.count({ where }),
        ]);

        // Get portfolio info to find the exchange
        const exchange = await db.exchange.findFirst({
            where: {
                portfolio: {
                    userId: targetUserId,
                },
                ...(exchangeId && { id: exchangeId }),
            },
            select: {
                id: true,
                name: true,
            },
        });

        if (!exchange) {
            console.error("Exchange not found for user:", targetUserId);
            return {
                accounts: [],
                total: 0,
            };
        }

        // Transform to client format with calculations
        const enrichedAccounts = accounts.map((account) => {
            // Map Prisma model to Zod schema
            const mappedAccount = {
                ...account,
                exchangeId: exchange.id,
                totalAsset: account.totalAssetValue,
                totalNetAsset: account.totalNetAssetValue,
                totalMarginBalance: account.totalNetAssetValue, // Approximation
                totalBorrowable: 0, // Not in DB
                totalCollateral: account.totalAssetValue, // Approximation
                totalInterestBTC: account.totalInterestAccrued,
                totalInterestUSDT: 0,
                tradeEnabled: account.tradeEnabled,
                transferEnabled: account.transferEnabled,
                borrowEnabled: true, // Default
                lastSyncedAt: account.updatedAt, // Use updatedAt as proxy
            };

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const clientAccount = toMarginAccountClient(mappedAccount as any);
            return enrichMarginAccountWithExchange(clientAccount, exchange);
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
