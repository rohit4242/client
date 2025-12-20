/**
 * Manual Trading Feature - Spot Order Schema
 * 
 * Zod validation schema for spot trading orders
 */

import { z } from "zod";

export const SpotOrderSchema = z.object({
    symbol: z.string().min(1, "Trading pair is required"),
    side: z.enum(["BUY", "SELL"]),
    type: z.enum(["MARKET", "LIMIT"]),
    quantity: z.string().optional(),
    quoteOrderQty: z.string().optional(),
    price: z.string().optional(),
    timeInForce: z.enum(["GTC", "IOC", "FOK"]).optional(),
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

export type SpotOrderInput = z.infer<typeof SpotOrderSchema>;

/**
 * Schema for place spot order action
 */
export const PlaceSpotOrderSchema = z.object({
    exchangeId: z.string().min(1, "Exchange is required"),
    order: SpotOrderSchema,
});

export type PlaceSpotOrderInput = z.infer<typeof PlaceSpotOrderSchema>;
