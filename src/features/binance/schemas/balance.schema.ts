/**
 * Binance Balance Schemas
 * 
 * Zod validation schemas for balance queries.
 */

import { z } from "zod";

// ============================================================================
// INPUT SCHEMAS
// ============================================================================

export const GetSpotBalanceInputSchema = z.object({
    exchangeId: z.string().uuid("Invalid exchange ID"),
});

export const GetMarginBalanceInputSchema = z.object({
    exchangeId: z.string().uuid("Invalid exchange ID"),
});

export const GetAssetBalanceInputSchema = z.object({
    exchangeId: z.string().uuid("Invalid exchange ID"),
    asset: z.string().min(2).max(10),
});

// ============================================================================
// OUTPUT SCHEMAS
// ============================================================================

export const AssetBalanceSchema = z.object({
    asset: z.string(),
    free: z.string(),
    locked: z.string(),
});

export const SpotBalanceResultSchema = z.object({
    balances: z.array(AssetBalanceSchema),
    totalBTC: z.number(),
    totalUSDT: z.number(),
});

export const MarginBalanceResultSchema = z.object({
    totalAssetOfBtc: z.string(),
    totalLiabilityOfBtc: z.string(),
    totalNetAssetOfBtc: z.string(),
    marginLevel: z.string(),
    tradeEnabled: z.boolean(),
    transferEnabled: z.boolean(),
    borrowEnabled: z.boolean(),
    userAssets: z.array(z.object({
        asset: z.string(),
        free: z.string(),
        locked: z.string(),
        borrowed: z.string(),
        interest: z.string(),
        netAsset: z.string(),
    })),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type GetSpotBalanceInput = z.infer<typeof GetSpotBalanceInputSchema>;
export type GetMarginBalanceInput = z.infer<typeof GetMarginBalanceInputSchema>;
export type GetAssetBalanceInput = z.infer<typeof GetAssetBalanceInputSchema>;
export type AssetBalance = z.infer<typeof AssetBalanceSchema>;
export type SpotBalanceResult = z.infer<typeof SpotBalanceResultSchema>;
export type MarginBalanceResult = z.infer<typeof MarginBalanceResultSchema>;
