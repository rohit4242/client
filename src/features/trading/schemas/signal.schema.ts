/**
 * Signal Validation Schemas
 * 
 * Zod schemas for validating webhook signal payloads
 */

import { z } from "zod";

/**
 * Standard webhook payload schema (JSON format)
 * 
 * Example:
 * {
 *   "action": "ENTER_LONG",
 *   "symbol": "BTCUSDT",
 *   "price": 45000,
 *   "message": "Entry signal triggered"
 * }
 */
export const WebhookPayloadSchema = z.object({
    action: z.enum(
        ["ENTER_LONG", "EXIT_LONG", "ENTER_SHORT", "EXIT_SHORT"],
        { message: "Action is required and must be one of: ENTER_LONG, EXIT_LONG, ENTER_SHORT, EXIT_SHORT" }
    ),
    symbol: z.string()
        .min(1, "Symbol is required")
        .transform(val => val.toUpperCase())
        .refine(val => /^[A-Z0-9]+$/.test(val), {
            message: "Symbol must contain only letters and numbers"
        }),
    price: z.number().positive().optional(),
    message: z.string().optional(),
});

/**
 * String format webhook payload schema
 * 
 * Format: ACTION_EXCHANGE_SYMBOL_NAME_TIMEFRAME_UUID
 * Example: "ENTER-LONG_BINANCE_BTCUSDT_Sample_4M_e267d336-a8a5-4c4b-96ee-8b71983d30d3"
 */
export const StringSignalFormatSchema = z.string()
    .min(1, "Signal string cannot be empty")
    .regex(
        /^(ENTER|EXIT)-(LONG|SHORT)_[A-Z]+_[A-Z0-9]+_.*$/,
        "Invalid string signal format. Expected: ACTION_EXCHANGE_SYMBOL_NAME_TIMEFRAME_UUID"
    );

/**
 * Type exports
 */
export type WebhookPayload = z.infer<typeof WebhookPayloadSchema>;
export type StringSignalFormat = z.infer<typeof StringSignalFormatSchema>;
