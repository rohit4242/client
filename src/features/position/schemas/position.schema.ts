/**
 * Position Zod Schemas
 * 
 * Comprehensive validation schemas for Position feature.
 * Handles spot and margin positions with full risk management.
 */

import { z } from "zod";
import {
    PositionStatus,
    Side,
    OrderOrderType,
    AccountType,
    MarginType,
    SideEffectType,
    Source,
} from "@prisma/client";

// ============================================================================
// INPUT SCHEMAS (for validation)
// ============================================================================

/**
 * Schema for getting positions with filters
 */
export const GetPositionsInputSchema = z.object({
    status: z.nativeEnum(PositionStatus).optional(),
    symbol: z.string().optional(),
    accountType: z.nativeEnum(AccountType).optional(),
    source: z.nativeEnum(Source).optional(),
    limit: z.number().int().positive().max(1000).optional(),
    userId: z.string().optional(), // For admin use

    // Pagination parameters (optional, defaults applied in action)
    page: z.number().int().positive().optional(),
    pageSize: z.number().int().positive().min(10).max(100).optional(),
});

/**
 * Schema for getting single position
 */
export const GetPositionInputSchema = z.object({
    id: z.string().uuid("Invalid position ID"),
});

/**
 * Schema for closing a position
 */
export const ClosePositionInputSchema = z.object({
    positionId: z.string().uuid("Invalid position ID"),
    // Binance response will be validated separately
});

/**
 * Schema for updating stop loss / take profit
 */
export const UpdateStopLossTakeProfitInputSchema = z.object({
    positionId: z.string().uuid("Invalid position ID"),
    stopLoss: z.number().positive().optional(),
    takeProfit: z.number().positive().optional(),
});

/**
 * Schema for force closing all positions
 */
export const ForceCloseAllInputSchema = z.object({
    userId: z.string().optional(), // For admin use
});

// ============================================================================
// OUTPUT SCHEMAS (for response validation)
// ============================================================================

/**
 * Position schema (server-side with Date objects)
 */
export const PositionSchema = z.object({
    id: z.string().uuid(),
    portfolioId: z.string().uuid(),

    // Trading type
    accountType: z.nativeEnum(AccountType),
    marginType: z.nativeEnum(MarginType).nullable(),

    // Core trade data
    symbol: z.string(),
    side: z.nativeEnum(Side),
    type: z.nativeEnum(OrderOrderType),
    entryPrice: z.number(),
    quantity: z.number(),
    entryValue: z.number(),

    // Current state
    currentPrice: z.number().nullable(),
    status: z.nativeEnum(PositionStatus),

    // Exit data
    exitPrice: z.number().nullable(),
    exitValue: z.number().nullable(),
    pnl: z.number(),
    pnlPercent: z.number(),

    // Risk management
    stopLoss: z.number().nullable(),
    takeProfit: z.number().nullable(),
    stopLossOrderId: z.string().nullable(),
    takeProfitOrderId: z.string().nullable(),
    stopLossStatus: z.string().nullable(),
    takeProfitStatus: z.string().nullable(),

    // Margin trading
    borrowedAmount: z.number(),
    borrowedAsset: z.string().nullable(),
    leverage: z.number(),
    sideEffectType: z.nativeEnum(SideEffectType),

    // Metadata
    source: z.nativeEnum(Source),
    botId: z.string().uuid().nullable(),
    strategyId: z.string().nullable(),

    // Critical warnings
    warningMessage: z.string().nullable(),

    // Timestamps
    openedAt: z.date(),
    closedAt: z.date().nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
});

/**
 * Client-safe position schema (with serialized dates)
 */
export const PositionClientSchema = PositionSchema.extend({
    openedAt: z.string(),
    closedAt: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
});

/**
 * Position with related data (exchange, bot info)
 */
export const PositionWithRelationsSchema = PositionClientSchema.extend({
    // Exchange info
    exchange: z.object({
        id: z.string().uuid(),
        name: z.string(),
    }),

    // Bot info (if applicable)
    bot: z.object({
        id: z.string().uuid(),
        name: z.string(),
        description: z.string().nullable(),
    }).nullable(),

    // Calculated fields
    unrealizedPnl: z.number(), // For open positions
    realizedPnl: z.number(),   // For closed positions
    pnlDisplay: z.number(),     // What to show to user
    roiPercent: z.number(),     // Return on investment %
});

/**
 * Position list result schema
 */
export const GetPositionsResultSchema = z.object({
    positions: z.array(PositionWithRelationsSchema),
    total: z.number(),

    // Pagination metadata
    page: z.number(),
    pageSize: z.number(),
    totalPages: z.number(),
    hasNextPage: z.boolean(),
    hasPreviousPage: z.boolean(),
});

/**
 * Single position result schema
 */
export const GetPositionResultSchema = z.object({
    position: PositionWithRelationsSchema.nullable(),
});

/**
 * Close position result schema
 */
export const ClosePositionResultSchema = z.object({
    positionId: z.string().uuid(),
    orderId: z.string().uuid(),
    binanceOrderId: z.string(),
    pnl: z.number(),
    pnlPercent: z.number(),
    status: z.nativeEnum(PositionStatus),
});

/**
 * Update SL/TP result schema
 */
export const UpdateStopLossTakeProfitResultSchema = z.object({
    positionId: z.string().uuid(),
    stopLoss: z.number().nullable(),
    takeProfit: z.number().nullable(),
    stopLossOrderId: z.string().nullable(),
    takeProfitOrderId: z.string().nullable(),
});

/**
 * Force close all result schema
 */
export const ForceCloseAllResultSchema = z.object({
    closedCount: z.number(),
    failedCount: z.number(),
    results: z.array(z.object({
        positionId: z.string().uuid(),
        success: z.boolean(),
        error: z.string().optional(),
    })),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

// Input types
export type GetPositionsInput = z.infer<typeof GetPositionsInputSchema>;
export type GetPositionInput = z.infer<typeof GetPositionInputSchema>;
export type ClosePositionInput = z.infer<typeof ClosePositionInputSchema>;
export type UpdateStopLossTakeProfitInput = z.infer<typeof UpdateStopLossTakeProfitInputSchema>;
export type ForceCloseAllInput = z.infer<typeof ForceCloseAllInputSchema>;

// Output types
export type Position = z.infer<typeof PositionSchema>;
export type PositionClient = z.infer<typeof PositionClientSchema>;
export type PositionWithRelations = z.infer<typeof PositionWithRelationsSchema>;
export type GetPositionsResult = z.infer<typeof GetPositionsResultSchema>;
export type GetPositionResult = z.infer<typeof GetPositionResultSchema>;
export type ClosePositionResult = z.infer<typeof ClosePositionResultSchema>;
export type UpdateStopLossTakeProfitResult = z.infer<typeof UpdateStopLossTakeProfitResultSchema>;
export type ForceCloseAllResult = z.infer<typeof ForceCloseAllResultSchema>;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Convert server position to client-safe format
 */
export function toPositionClient(position: Position): PositionClient {
    return {
        ...position,
        openedAt: position.openedAt.toISOString(),
        closedAt: position.closedAt?.toISOString() ?? null,
        createdAt: position.createdAt.toISOString(),
        updatedAt: position.updatedAt.toISOString(),
    };
}

/**
 * Calculate PnL for a position
 */
export function calculatePositionPnl(position: {
    side: Side;
    entryPrice: number;
    entryValue: number;
    currentPrice?: number | null;
    exitPrice?: number | null;
    quantity: number;
    status: PositionStatus;
    pnl: number; // Database value for closed positions
}): {
    unrealizedPnl: number;
    realizedPnl: number;
    pnlDisplay: number;
    roiPercent: number;
} {
    const isClosedPosition =
        position.status === PositionStatus.CLOSED ||
        position.status === PositionStatus.CANCELED;

    if (isClosedPosition) {
        // Use database PnL for closed positions
        const realizedPnl = position.pnl;
        const roiPercent = position.entryValue > 0
            ? (realizedPnl / position.entryValue) * 100
            : 0;

        return {
            unrealizedPnl: 0,
            realizedPnl,
            pnlDisplay: realizedPnl,
            roiPercent,
        };
    }

    // Calculate unrealized PnL for open positions
    const currentPrice = position.currentPrice ?? position.entryPrice;
    const exitValue = currentPrice * position.quantity;

    let unrealizedPnl: number;
    if (position.side === Side.LONG) {
        // Long: profit when price goes up
        unrealizedPnl = exitValue - position.entryValue;
    } else {
        // Short: profit when price goes down
        unrealizedPnl = position.entryValue - exitValue;
    }

    const roiPercent = position.entryValue > 0
        ? (unrealizedPnl / position.entryValue) * 100
        : 0;

    return {
        unrealizedPnl,
        realizedPnl: 0,
        pnlDisplay: unrealizedPnl,
        roiPercent,
    };
}

/**
 * Add calculated fields to position
 */
export function enrichPositionWithCalculations(
    position: PositionClient,
    exchange: { id: string; name: string },
    bot?: { id: string; name: string; description: string | null } | null
): PositionWithRelations {
    const pnlData = calculatePositionPnl({
        side: position.side,
        entryPrice: position.entryPrice,
        entryValue: position.entryValue,
        currentPrice: position.currentPrice,
        exitPrice: position.exitPrice,
        quantity: position.quantity,
        status: position.status,
        pnl: position.pnl,
    });

    return {
        ...position,
        exchange,
        bot: bot ?? null,
        ...pnlData,
    };
}
