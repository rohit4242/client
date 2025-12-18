/**
 * Margin Zod Schemas
 * 
 * Comprehensive validation schemas for Margin feature.
 * Handles margin accounts, borrow/repay operations, and interest calculations.
 */

import { z } from "zod";
import { MarginType } from "@prisma/client";

// ============================================================================
// INPUT SCHEMAS (for validation)
// ============================================================================

/**
 * Schema for getting margin accounts
 */
export const GetMarginAccountsInputSchema = z.object({
    exchangeId: z.string().uuid().optional(),
    userId: z.string().optional(), // For admin use
});

/**
 * Schema for getting single margin account
 */
export const GetMarginAccountInputSchema = z.object({
    id: z.string().uuid("Invalid margin account ID"),
});

/**
 * Schema for syncing margin account balance
 */
export const SyncMarginBalanceInputSchema = z.object({
    id: z.string().uuid("Invalid margin account ID"),
});

// ============================================================================
// OUTPUT SCHEMAS (for response validation)
// ============================================================================

/**
 * Margin account schema (server-side with Date objects)
 */
export const MarginAccountSchema = z.object({
    id: z.string().uuid(),
    portfolioId: z.string().uuid(),
    exchangeId: z.string().uuid(),
    marginType: z.nativeEnum(MarginType),

    // Balances
    totalAsset: z.number(), // Total asset in BTC
    totalLiability: z.number(), // Total borrowed + interest in BTC
    totalNetAsset: z.number(), // Total asset - liability
    totalMarginBalance: z.number(), // Available margin

    // Cross margin specific
    marginLevel: z.number(), // Margin level percentage
    indexPrice: z.number().nullable(),

    // Borrowing limits
    totalBorrowable: z.number(), // Maximum borrowable
    totalCollateral: z.number(), // Total collateral

    // Interest
    totalInterestBTC: z.number(),
    totalInterestUSDT: z.number(),

    // Status
    tradeEnabled: z.boolean(),
    transferEnabled: z.boolean(),
    borrowEnabled: z.boolean(),

    // Timestamps
    lastSyncedAt: z.date().nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
});

/**
 * Client-safe margin account schema
 */
export const MarginAccountClientSchema = MarginAccountSchema.extend({
    lastSyncedAt: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),

    // Calculated fields
    utilizationPercent: z.number(), // How much of borrowable is used
    collateralRatio: z.number(), // Collateral / Liability ratio
    healthFactor: z.number(), // Account health score
});

/**
 * Margin account with exchange info
 */
export const MarginAccountWithExchangeSchema = MarginAccountClientSchema.extend({
    exchange: z.object({
        id: z.string().uuid(),
        name: z.string(),
    }),
});

/**
 * Get margin accounts result
 */
export const GetMarginAccountsResultSchema = z.object({
    accounts: z.array(MarginAccountWithExchangeSchema),
    total: z.number(),
});

/**
 * Get margin account result
 */
export const GetMarginAccountResultSchema = z.object({
    account: MarginAccountWithExchangeSchema.nullable(),
});

/**
 * Sync balance result
 */
export const SyncMarginBalanceResultSchema = z.object({
    totalAsset: z.number(),
    totalLiability: z.number(),
    marginLevel: z.number(),
    synced: z.boolean(),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

// Input types
export type GetMarginAccountsInput = z.infer<typeof GetMarginAccountsInputSchema>;
export type GetMarginAccountInput = z.infer<typeof GetMarginAccountInputSchema>;
export type SyncMarginBalanceInput = z.infer<typeof SyncMarginBalanceInputSchema>;

// Output types
export type MarginAccount = z.infer<typeof MarginAccountSchema>;
export type MarginAccountClient = z.infer<typeof MarginAccountClientSchema>;
export type MarginAccountWithExchange = z.infer<typeof MarginAccountWithExchangeSchema>;
export type GetMarginAccountsResult = z.infer<typeof GetMarginAccountsResultSchema>;
export type GetMarginAccountResult = z.infer<typeof GetMarginAccountResultSchema>;
export type SyncMarginBalanceResult = z.infer<typeof SyncMarginBalanceResultSchema>;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Convert server margin account to client-safe format with calculations
 */
export function toMarginAccountClient(account: MarginAccount): MarginAccountClient {
    // Calculate utilization percentage
    const utilizationPercent = account.totalBorrowable > 0
        ? (account.totalLiability / account.totalBorrowable) * 100
        : 0;

    // Calculate collateral ratio
    const collateralRatio = account.totalLiability > 0
        ? account.totalCollateral / account.totalLiability
        : Infinity;

    // Calculate health factor (higher is better)
    // Health factor < 1.0 means liquidation risk
    const healthFactor = account.totalLiability > 0
        ? (account.totalCollateral * account.marginLevel) / (account.totalLiability * 100)
        : Infinity;

    return {
        ...account,
        lastSyncedAt: account.lastSyncedAt?.toISOString() ?? null,
        createdAt: account.createdAt.toISOString(),
        updatedAt: account.updatedAt.toISOString(),
        utilizationPercent,
        collateralRatio,
        healthFactor,
    };
}

/**
 * Add exchange info to margin account
 */
export function enrichMarginAccountWithExchange(
    account: MarginAccountClient,
    exchange: { id: string; name: string }
): MarginAccountWithExchange {
    return {
        ...account,
        exchange,
    };
}

/**
 * Calculate liquidation risk level
 */
export function calculateLiquidationRisk(
    marginLevel: number,
    healthFactor: number
): "SAFE" | "WARNING" | "DANGER" | "CRITICAL" {
    if (healthFactor < 1.1) return "CRITICAL"; // Liquidation imminent
    if (healthFactor < 1.5) return "DANGER"; // High risk
    if (marginLevel < 2.0 || healthFactor < 2.0) return "WARNING"; // Moderate risk
    return "SAFE"; // Low risk
}

/**
 * Calculate maximum safe borrow amount
 */
export function calculateMaxSafeBorrow(
    totalCollateral: number,
    currentLiability: number,
    targetMarginLevel: number = 3.0 // Conservative target
): number {
    // Max liability = collateral / target margin level
    const maxLiability = totalCollateral / targetMarginLevel;
    const additionalBorrow = maxLiability - currentLiability;
    return Math.max(0, additionalBorrow);
}

/**
 * Estimate daily interest cost
 */
export function estimateDailyInterest(
    borrowedAmount: number,
    annualInterestRate: number = 0.05 // 5% default annual rate
): number {
    const dailyRate = annualInterestRate / 365;
    return borrowedAmount * dailyRate;
}
