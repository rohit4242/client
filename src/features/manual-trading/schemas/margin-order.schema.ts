/**
 * Manual Trading Feature - Margin Order Schema
 * 
 * Zod validation schema for margin trading orders
 */

import { z } from "zod";

export const MarginOrderSchema = z.object({
    symbol: z.string().min(1, "Trading pair is required"),
    side: z.enum(["BUY", "SELL"]),
    type: z.enum(["MARKET", "LIMIT"]),
    quantity: z.string().optional(),
    quoteOrderQty: z.string().optional(),
    price: z.string().optional(),
    timeInForce: z.enum(["GTC", "IOC", "FOK"]).optional(),
    sideEffectType: z.enum([
        "NO_SIDE_EFFECT",
        "MARGIN_BUY",
        "AUTO_REPAY",
    ]).default("NO_SIDE_EFFECT"),
    stopLoss: z.number().optional(),
    takeProfit: z.number().optional(),
}).refine(
    (data) => {
        // For market orders, either quantity or quoteOrderQty must be provided
        if (data.type === "MARKET") {
            return !!data.quantity || !!data.quoteOrderQty;
        }
        // For limit orders, quantity and price must be provided
        if (data.type === "LIMIT") {
            return !!data.quantity && !!data.price;
        }
        return true;
    },
    {
        message: "Invalid order parameters",
    }
);

export type MarginOrderInput = z.infer<typeof MarginOrderSchema>;

/**
 * Schema for place margin order action
 */
export const PlaceMarginOrderSchema = z.object({
    exchangeId: z.string().min(1, "Exchange is required"),
    order: MarginOrderSchema,
});

export type PlaceMarginOrderInput = z.infer<typeof PlaceMarginOrderSchema>;
