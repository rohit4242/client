/**
 * Binance Order Schemas
 * 
 * Zod validation schemas for order operations.
 */

import { z } from "zod";

// ============================================================================
// INPUT SCHEMAS
// ============================================================================

/**
 * Place order input schema
 */
export const PlaceOrderInputSchema = z.object({
    exchangeId: z.string().uuid("Invalid exchange ID"),
    symbol: z.string().min(4, "Symbol too short").max(12, "Symbol too long"),
    side: z.enum(["BUY", "SELL"]),
    type: z.enum(["MARKET", "LIMIT"]),
    accountType: z.enum(["SPOT", "MARGIN"]).default("SPOT"),

    // Optional fields
    quantity: z.string().optional(),
    quoteOrderQty: z.string().optional(),
    price: z.string().optional(),
    timeInForce: z.enum(["GTC", "IOC", "FOK"]).optional(),

    // Margin-specific
    sideEffectType: z.enum(["NO_SIDE_EFFECT", "MARGIN_BUY", "AUTO_REPAY", "AUTO_BORROW_REPAY"]).optional(),
}).refine(
    (data) => {
        // For market orders, either quantity or quoteOrderQty is required
        if (data.type === "MARKET") {
            return !!(data.quantity || data.quoteOrderQty);
        }
        // For limit orders, both quantity and price are required
        if (data.type === "LIMIT") {
            return !!(data.quantity && data.price);
        }
        return true;
    },
    {
        message: "Invalid order parameters for order type",
    }
);

/**
 * Close position input schema
 */
export const ClosePositionInputSchema = z.object({
    positionId: z.string().uuid("Invalid position ID"),
    sideEffectType: z.enum(["NO_SIDE_EFFECT", "AUTO_REPAY"]).optional(),
});

/**
 * Place protective order input schema (SL/TP)
 */
export const PlaceProtectiveOrderInputSchema = z.object({
    positionId: z.string().uuid("Invalid position ID"),
    type: z.enum(["STOP_LOSS", "TAKE_PROFIT"]),
    triggerPercent: z.number().min(0.1).max(100),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type PlaceOrderInput = z.infer<typeof PlaceOrderInputSchema>;
export type ClosePositionInput = z.infer<typeof ClosePositionInputSchema>;
export type PlaceProtectiveOrderInput = z.infer<typeof PlaceProtectiveOrderInputSchema>;
