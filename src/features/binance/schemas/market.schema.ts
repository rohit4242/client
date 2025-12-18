/**
 * Binance Market Data Schemas
 * 
 * Zod validation schemas for market data queries.
 */

import { z } from "zod";

// ============================================================================
// INPUT SCHEMAS
// ============================================================================

export const GetSymbolPriceInputSchema = z.object({
    exchangeId: z.string().uuid("Invalid exchange ID"),
    symbol: z.string().min(4).max(12),
});

export const GetSymbolInfoInputSchema = z.object({
    exchangeId: z.string().uuid("Invalid exchange ID"),
    symbol: z.string().min(4).max(12),
});

export const GetTicker24hInputSchema = z.object({
    exchangeId: z.string().uuid("Invalid exchange ID"),
    symbol: z.string().min(4).max(12),
});

// ============================================================================
// OUTPUT SCHEMAS
// ============================================================================

export const SymbolPriceSchema = z.object({
    symbol: z.string(),
    price: z.string(),
});

export const Ticker24hSchema = z.object({
    symbol: z.string(),
    priceChange: z.string(),
    priceChangePercent: z.string(),
    lastPrice: z.string(),
    volume: z.string(),
    quoteVolume: z.string(),
    highPrice: z.string(),
    lowPrice: z.string(),
    openPrice: z.string(),
});

export const SymbolFilterSchema = z.object({
    filterType: z.string(),
    minPrice: z.string().optional(),
    maxPrice: z.string().optional(),
    tickSize: z.string().optional(),
    minQty: z.string().optional(),
    maxQty: z.string().optional(),
    stepSize: z.string().optional(),
    minNotional: z.string().optional(),
});

export const SymbolInfoSchema = z.object({
    symbol: z.string(),
    status: z.string(),
    baseAsset: z.string(),
    quoteAsset: z.string(),
    baseAssetPrecision: z.number(),
    quoteAssetPrecision: z.number(),
    filters: z.array(SymbolFilterSchema),
    isSpotTradingAllowed: z.boolean(),
    isMarginTradingAllowed: z.boolean(),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type GetSymbolPriceInput = z.infer<typeof GetSymbolPriceInputSchema>;
export type GetSymbolInfoInput = z.infer<typeof GetSymbolInfoInputSchema>;
export type GetTicker24hInput = z.infer<typeof GetTicker24hInputSchema>;
export type SymbolPrice = z.infer<typeof SymbolPriceSchema>;
export type Ticker24h = z.infer<typeof Ticker24hSchema>;
export type SymbolFilter = z.infer<typeof SymbolFilterSchema>;
export type SymbolInfo = z.infer<typeof SymbolInfoSchema>;
