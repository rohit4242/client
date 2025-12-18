/**
 * Portfolio Zod Schemas
 * 
 * Comprehensive validation schemas for Portfolio feature.
 * Includes portfolio stats, balance tracking, and performance metrics.
 */

import { z } from "zod";

// ============================================================================
// INPUT SCHEMAS (for validation)
// ============================================================================

/**
 * Schema for syncing portfolio balance
 */
export const SyncPortfolioBalanceInputSchema = z.object({
    userId: z.string().optional(), // For admin use
});

/**
 * Schema for calculating portfolio stats
 */
export const CalculatePortfolioStatsInputSchema = z.object({
    userId: z.string().optional(), // For admin use
});

/**
 * Schema for getting portfolio history
 */
export const GetPortfolioHistoryInputSchema = z.object({
    period: z.enum(["day", "week", "month", "year", "all"]).default("month"),
    userId: z.string().optional(), // For admin use
});

// ============================================================================
// OUTPUT SCHEMAS (for response validation)
// ============================================================================

/**
 * Portfolio statistics schema
 */
export const PortfolioStatsSchema = z.object({
    // Performance Metrics
    totalPnl: z.number(),
    totalPnlPercent: z.number(),
    totalWins: z.number(),
    totalLosses: z.number(),
    winRate: z.number(),

    // Balance Tracking
    initialBalance: z.number(),
    currentBalance: z.number(),
    totalDeposits: z.number(),
    totalWithdrawals: z.number(),

    // Time-based Analytics
    dailyPnl: z.number(),
    weeklyPnl: z.number(),
    monthlyPnl: z.number(),

    // Statistics
    totalTrades: z.number(),
    activeTrades: z.number(),
    avgWinAmount: z.number(),
    avgLossAmount: z.number(),
    largestWin: z.number(),
    largestLoss: z.number(),
    profitFactor: z.number(),

    // Separate balances
    spotBalance: z.number(),
    marginBalance: z.number(),

    // Metadata
    lastCalculatedAt: z.string(),
});

/**
 * Portfolio full schema (includes portfolio ID and userId)
 */
export const PortfolioSchema = z.object({
    id: z.string().uuid(),
    userId: z.string(),
    name: z.string(),

    // Performance Metrics
    totalPnl: z.number(),
    totalPnlPercent: z.number(),
    totalWins: z.number(),
    totalLosses: z.number(),
    winRate: z.number(),

    // Balance Tracking
    initialBalance: z.number(),
    currentBalance: z.number(),
    totalDeposits: z.number(),
    totalWithdrawals: z.number(),

    // Time-based Analytics
    dailyPnl: z.number(),
    weeklyPnl: z.number(),
    monthlyPnl: z.number(),

    // Statistics
    totalTrades: z.number(),
    activeTrades: z.number(),
    avgWinAmount: z.number(),
    avgLossAmount: z.number(),
    largestWin: z.number(),
    largestLoss: z.number(),
    profitFactor: z.number(),

    // Separate balances
    spotBalance: z.number(),
    marginBalance: z.number(),

    // Metadata
    lastCalculatedAt: z.date(),
    createdAt: z.date(),
    updatedAt: z.date(),
});

/**
 * Client-safe portfolio schema (with serialized dates)
 */
export const PortfolioClientSchema = PortfolioSchema.extend({
    lastCalculatedAt: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
});

/**
 * Balance snapshot schema (for history charts)
 */
export const BalanceSnapshotSchema = z.object({
    id: z.string().uuid(),
    portfolioId: z.string().uuid(),
    timestamp: z.date(),

    // Spot balances
    spotBalance: z.number(),
    spotAvailable: z.number(),
    spotInOrders: z.number(),

    // Margin balances
    marginBalance: z.number(),
    marginAvailable: z.number(),
    marginBorrowed: z.number(),
    marginInterest: z.number(),
    marginNetAsset: z.number(),
    marginLevel: z.number(),

    // Total portfolio value
    totalValue: z.number(),
    totalPnl: z.number(),

    // Performance metrics
    dailyReturn: z.number(),
    totalReturnPercent: z.number(),

    createdAt: z.date(),
});

/**
 * Client-safe balance snapshot schema
 */
export const BalanceSnapshotClientSchema = BalanceSnapshotSchema.extend({
    timestamp: z.string(),
    createdAt: z.string(),
});

/**
 * Portfolio history chart data point
 */
export const ChartDataPointSchema = z.object({
    date: z.string(),
    value: z.number(),
    pnl: z.number(),
    change: z.number(), // Percentage change
});

/**
 * Get portfolio result schema
 */
export const GetPortfolioResultSchema = z.object({
    portfolio: PortfolioClientSchema.nullable(),
});

/**
 * Get portfolio stats result schema
 */
export const GetPortfolioStatsResultSchema = z.object({
    stats: PortfolioStatsSchema.nullable(),
});

/**
 * Get portfolio history result schema
 */
export const GetPortfolioHistoryResultSchema = z.object({
    data: z.array(ChartDataPointSchema),
    period: z.enum(["day", "week", "month", "year", "all"]),
});

/**
 * Sync balance result schema
 */
export const SyncBalanceResultSchema = z.object({
    initialBalance: z.number(),
    currentBalance: z.number(),
    synced: z.boolean(),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

// Input types
export type SyncPortfolioBalanceInput = z.infer<typeof SyncPortfolioBalanceInputSchema>;
export type CalculatePortfolioStatsInput = z.infer<typeof CalculatePortfolioStatsInputSchema>;
export type GetPortfolioHistoryInput = z.infer<typeof GetPortfolioHistoryInputSchema>;

// Output types
export type PortfolioStats = z.infer<typeof PortfolioStatsSchema>;
export type Portfolio = z.infer<typeof PortfolioSchema>;
export type PortfolioClient = z.infer<typeof PortfolioClientSchema>;
export type BalanceSnapshot = z.infer<typeof BalanceSnapshotSchema>;
export type BalanceSnapshotClient = z.infer<typeof BalanceSnapshotClientSchema>;
export type ChartDataPoint = z.infer<typeof ChartDataPointSchema>;
export type GetPortfolioResult = z.infer<typeof GetPortfolioResultSchema>;
export type GetPortfolioStatsResult = z.infer<typeof GetPortfolioStatsResultSchema>;
export type GetPortfolioHistoryResult = z.infer<typeof GetPortfolioHistoryResultSchema>;
export type SyncBalanceResult = z.infer<typeof SyncBalanceResultSchema>;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Convert server portfolio to client-safe format
 */
export function toPortfolioClient(portfolio: Portfolio): PortfolioClient {
    return {
        ...portfolio,
        lastCalculatedAt: portfolio.lastCalculatedAt.toISOString(),
        createdAt: portfolio.createdAt.toISOString(),
        updatedAt: portfolio.updatedAt.toISOString(),
    };
}

/**
 * Convert server balance snapshot to client-safe format
 */
export function toBalanceSnapshotClient(snapshot: BalanceSnapshot): BalanceSnapshotClient {
    return {
        ...snapshot,
        timestamp: snapshot.timestamp.toISOString(),
        createdAt: snapshot.createdAt.toISOString(),
    };
}
