/**
 * Order Input Schema
 * 
 * Zod validation for manual trading orders
 */

import { z } from "zod";

export const PlaceOrderInputSchema = z.object({
    exchangeId: z.string().uuid("Invalid exchange ID"),
    symbol: z.string().min(4).max(12).toUpperCase(),
    side: z.enum(["BUY", "SELL"], { message: "Side is required" }),
    type: z.enum(["MARKET", "LIMIT"], { message: "Order type is required" }),
    accountType: z.enum(["SPOT", "MARGIN"], { message: "Account type is required" }),

    // Quantity (one must be provided for market orders)
    quantity: z.string().optional(),
    quoteOrderQty: z.string().optional(),

    // Price (required for limit orders)
    price: z.string().optional(),

    // Optional params
    timeInForce: z.enum(["GTC", "IOC", "FOK"]).optional(),
    sideEffectType: z.enum(["NO_SIDE_EFFECT", "MARGIN_BUY", "AUTO_REPAY"]).optional(),

    // Protective orders
    stopLoss: z.number().min(0).max(100).optional(), // Percentage
    takeProfit: z.number().min(0).max(1000).optional(), // Percentage
}).refine(
    (data) => {
        // For market orders, require either quantity or quoteOrderQty
        if (data.type === "MARKET") {
            return !!data.quantity || !!data.quoteOrderQty;
        }
        return true;
    },
    {
        message: "Either quantity or quoteOrderQty is required for market orders",
        path: ["quantity"],
    }
).refine(
    (data) => {
        // For limit orders, require quantity and price
        if (data.type === "LIMIT") {
            return !!data.quantity && !!data.price;
        }
        return true;
    },
    {
        message: "Quantity and price are required for limit orders",
        path: ["quantity"],
    }
);

export type PlaceOrderInput = z.infer<typeof PlaceOrderInputSchema>;
