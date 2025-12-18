/**
 * Order Zod Schemas
 * 
 * Comprehensive validation schemas for Order feature.
 * Handles order tracking, execution details, and commission.
 */

import { z } from "zod";
import {
    OrderType,
    OrderSide,
    OrderOrderType,
    OrderStatus,
    TimeInForce,
    AccountType,
    MarginType,
    SideEffectType,
} from "@prisma/client";

// ============================================================================
// INPUT SCHEMAS (for validation)
// ============================================================================

/**
 * Schema for getting orders with filters
 */
export const GetOrdersInputSchema = z.object({
    positionId: z.string().uuid().optional(),
    symbol: z.string().optional(),
    status: z.nativeEnum(OrderStatus).optional(),
    type: z.nativeEnum(OrderType).optional(),
    limit: z.number().int().positive().max(1000).optional(),
    userId: z.string().optional(), // For admin use
});

/**
 * Schema for getting single order
 */
export const GetOrderInputSchema = z.object({
    id: z.string().uuid("Invalid order ID"),
});

// ============================================================================
// OUTPUT SCHEMAS (for response validation)
// ============================================================================

/**
 * Order schema (server-side with Date objects)
 */
export const OrderSchema = z.object({
    id: z.string().uuid(),
    positionId: z.string().uuid(),
    portfolioId: z.string().uuid(),

    // Trading type
    accountType: z.nativeEnum(AccountType),
    marginType: z.nativeEnum(MarginType).nullable(),

    // Order identification
    orderId: z.string(),
    clientOrderId: z.string().nullable(),
    symbol: z.string(),
    type: z.nativeEnum(OrderType),
    side: z.nativeEnum(OrderSide),
    orderType: z.nativeEnum(OrderOrderType),

    // Order details
    price: z.number(),
    quantity: z.number(),
    value: z.number(),
    quoteOrderQty: z.number().nullable(),

    // Execution details
    executedQty: z.number(),
    cummulativeQuoteQty: z.number(),
    avgPrice: z.number().nullable(),

    // Margin-specific
    sideEffectType: z.nativeEnum(SideEffectType),

    // Time in force
    timeInForce: z.nativeEnum(TimeInForce).nullable(),

    // Status
    status: z.nativeEnum(OrderStatus),
    fillPercent: z.number(),

    // P&L and fees
    pnl: z.number(),
    commission: z.number(),
    commissionAsset: z.string().nullable(),

    // Details
    details: z.string().nullable(),
    errorMessage: z.string().nullable(),

    // Timestamps
    transactTime: z.date().nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
});

/**
 * Client-safe order schema (with serialized dates)
 */
export const OrderClientSchema = OrderSchema.extend({
    transactTime: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
});

/**
 * Order with position info
 */
export const OrderWithPositionSchema = OrderClientSchema.extend({
    position: z.object({
        id: z.string().uuid(),
        symbol: z.string(),
        side: z.enum(["LONG", "SHORT"]),
        status: z.string(),
    }).nullable(),
});

/**
 * Order list result schema
 */
export const GetOrdersResultSchema = z.object({
    orders: z.array(OrderWithPositionSchema),
    total: z.number(),
});

/**
 * Single order result schema
 */
export const GetOrderResultSchema = z.object({
    order: OrderWithPositionSchema.nullable(),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

// Input types
export type GetOrdersInput = z.infer<typeof GetOrdersInputSchema>;
export type GetOrderInput = z.infer<typeof GetOrderInputSchema>;

// Output types
export type Order = z.infer<typeof OrderSchema>;
export type OrderClient = z.infer<typeof OrderClientSchema>;
export type OrderWithPosition = z.infer<typeof OrderWithPositionSchema>;
export type GetOrdersResult = z.infer<typeof GetOrdersResultSchema>;
export type GetOrderResult = z.infer<typeof GetOrderResultSchema>;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Convert server order to client-safe format
 */
export function toOrderClient(order: Order): OrderClient {
    return {
        ...order,
        transactTime: order.transactTime?.toISOString() ?? null,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
    };
}

/**
 * Add position info to order
 */
export function enrichOrderWithPosition(
    order: OrderClient,
    position?: { id: string; symbol: string; side: any; status: string } | null
): OrderWithPosition {
    return {
        ...order,
        position: position
            ? {
                id: position.id,
                symbol: position.symbol,
                side: position.side === "LONG" ? "LONG" : "SHORT",
                status: position.status,
            }
            : null,
    };
}
