/**
 * Trading Zod Schemas
 * 
 * Schemas for real-time trading data (balance, prices, symbols).
 */

import { z } from "zod";

// ============================================================================
// INPUT SCHEMAS
// ============================================================================

export const GetSpotBalanceInputSchema = z.object({
    exchangeId: z.string().uuid().optional(),
});

export const GetMarginBalanceInputSchema = z.object({
    exchangeId: z.string().uuid().optional(),
});

export const GetSymbolPriceInputSchema = z.object({
    symbol: z.string(),
    exchangeId: z.string().uuid().optional(),
});

// ============================================================================
// OUTPUT SCHEMAS
// ============================================================================

export const AssetBalanceSchema = z.object({
    asset: z.string(),
    free: z.number(),
    locked: z.number(),
    total: z.number(),
});

export const SpotBalanceSchema = z.object({
    balances: z.array(AssetBalanceSchema),
    totalBTC: z.number(),
    totalUSDT: z.number(),
});

export const MarginBalanceSchema = z.object({
    balances: z.array(AssetBalanceSchema),
    totalAsset: z.number(),
    totalLiability: z.number(),
    totalNetAsset: z.number(),
    marginLevel: z.number(),
});

export const SymbolPriceSchema = z.object({
    symbol: z.string(),
    price: z.number(),
    priceChangePercent: z.number().optional(),
    volume: z.number().optional(),
    timestamp: z.number(),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type GetSpotBalanceInput = z.infer<typeof GetSpotBalanceInputSchema>;
export type GetMarginBalanceInput = z.infer<typeof GetMarginBalanceInputSchema>;
export type GetSymbolPriceInput = z.infer<typeof GetSymbolPriceInputSchema>;
export type AssetBalance = z.infer<typeof AssetBalanceSchema>;
export type SpotBalance = z.infer<typeof SpotBalanceSchema>;
export type MarginBalance = z.infer<typeof MarginBalanceSchema>;
export type SymbolPrice = z.infer<typeof SymbolPriceSchema>;
