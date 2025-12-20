/**
 * Exchange Zod Schemas
 * 
 * Comprehensive validation schemas for Exchange feature.
 * All types are inferred from these schemas for maximum type safety.
 */

import { z } from "zod";
import { PositionMode } from "@prisma/client";

// ============================================================================
// INPUT SCHEMAS (for validation)
// ============================================================================

/**
 * Schema for creating a new exchange
 */
export const CreateExchangeInputSchema = z.object({
    name: z
        .string()
        .min(1, "Exchange name is required")
        .transform((val) => val.toUpperCase()),
    apiKey: z.string().min(1, "API key is required"),
    apiSecret: z.string().min(1, "API secret is required"),
    positionMode: z.nativeEnum(PositionMode).default(PositionMode.Hedge),
    userId: z.string().optional(), // For admin creating exchange for customer
});

/**
 * Schema for updating an exchange
 */
export const UpdateExchangeInputSchema = z.object({
    id: z.string().uuid("Invalid exchange ID"),
    userId: z.string().optional(), // For admin updating exchange for customer
    name: z
        .string()
        .min(1, "Exchange name is required")
        .transform((val) => val.toUpperCase())
        .optional(),
    apiKey: z.string().min(1, "API key is required").optional(),
    apiSecret: z.string().min(1, "API secret is required").optional(),
    positionMode: z.nativeEnum(PositionMode).optional(),
    isActive: z.boolean().optional(),
});

/**
 * Schema for deleting an exchange
 */
export const DeleteExchangeInputSchema = z.object({
    id: z.string().uuid("Invalid exchange ID"),
    userId: z.string().optional(), // For admin deleting exchange for customer
});

/**
 * Schema for syncing exchange balance
 */
export const SyncExchangeInputSchema = z.object({
    id: z.string().uuid("Invalid exchange ID"),
    userId: z.string().optional(), // For admin syncing exchange for customer
});

// ============================================================================
// OUTPUT SCHEMAS (for response validation)
// ============================================================================

/**
 * Base exchange schema (server-side with Date objects)
 */
export const ExchangeSchema = z.object({
    id: z.string().uuid(),
    portfolioId: z.string().uuid(),
    name: z.string(),
    apiKey: z.string(),
    apiSecret: z.string(),
    positionMode: z.nativeEnum(PositionMode),
    isActive: z.boolean(),
    spotValue: z.number(),
    marginValue: z.number(),
    totalValue: z.number(),
    lastSyncedAt: z.date().nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
});

/**
 * Client-safe exchange schema (with serialized dates)
 */
export const ExchangeClientSchema = z.object({
    id: z.string().uuid(),
    portfolioId: z.string().uuid(),
    name: z.string(),
    apiKey: z.string(),
    apiSecret: z.string(),
    positionMode: z.nativeEnum(PositionMode),
    isActive: z.boolean(),
    spotValue: z.number(),
    marginValue: z.number(),
    totalValue: z.number(),
    lastSyncedAt: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
});

/**
 * Exchange list response schema
 */
export const GetExchangesResultSchema = z.object({
    exchanges: z.array(ExchangeClientSchema),
});

/**
 * Single exchange response schema
 */
export const GetExchangeResultSchema = z.object({
    exchange: ExchangeClientSchema,
});

/**
 * Sync exchange response schema
 */
export const SyncExchangeResultSchema = z.object({
    spotValue: z.number(),
    marginValue: z.number(),
    totalValue: z.number(),
    lastSyncedAt: z.string(),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

// Input types
export type CreateExchangeInput = z.infer<typeof CreateExchangeInputSchema>;
export type UpdateExchangeInput = z.infer<typeof UpdateExchangeInputSchema>;
export type DeleteExchangeInput = z.infer<typeof DeleteExchangeInputSchema>;
export type SyncExchangeInput = z.infer<typeof SyncExchangeInputSchema>;

// Output types
export type Exchange = z.infer<typeof ExchangeSchema>;
export type ExchangeClient = z.infer<typeof ExchangeClientSchema>;
export type GetExchangesResult = z.infer<typeof GetExchangesResultSchema>;
export type GetExchangeResult = z.infer<typeof GetExchangeResultSchema>;
export type SyncExchangeResult = z.infer<typeof SyncExchangeResultSchema>;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Convert server exchange to client-safe format
 */
export function toExchangeClient(exchange: Exchange): ExchangeClient {
    return {
        ...exchange,
        lastSyncedAt: exchange.lastSyncedAt?.toISOString() ?? null,
        createdAt: exchange.createdAt.toISOString(),
        updatedAt: exchange.updatedAt.toISOString(),
    };
}

/**
 * Convert multiple server exchanges to client-safe format
 */
export function toExchangesClient(exchanges: Exchange[]): ExchangeClient[] {
    return exchanges.map(toExchangeClient);
}
