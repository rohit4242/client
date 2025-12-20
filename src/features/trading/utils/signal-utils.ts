/**
 * Signal Management Utilities
 * 
 * Reusable utilities for signal parsing, validation, and database operations
 */

import { db } from "@/lib/db/client";
import type { Signal } from "@prisma/client";
import { WebhookPayloadSchema, StringSignalFormatSchema, type WebhookPayload } from "../schemas/signal.schema";
import type { TradingResult } from "../types/trading.types";

/**
 * Parse webhook payload from request body
 * 
 * Supports two formats:
 * 1. JSON: { "action": "ENTER_LONG", "symbol": "BTCUSDT", ... }
 * 2. String: "ENTER-LONG_BINANCE_BTCUSDT_Sample_4M_uuid"
 * 
 * @param body - Request body (string or object)
 * @returns Parsed and validated webhook payload
 * @throws Error if format is invalid
 */
export function parseWebhookPayload(body: string | object): WebhookPayload {
    // Handle JSON format
    if (typeof body === "object" && body !== null) {
        const result = WebhookPayloadSchema.safeParse(body);
        if (!result.success) {
            throw new Error(`Invalid JSON payload: ${result.error.issues.map(i => i.message).join(", ")}`);
        }
        return result.data;
    }

    // Handle string format
    if (typeof body === "string") {
        // First validate string format
        const stringResult = StringSignalFormatSchema.safeParse(body);
        if (!stringResult.success) {
            throw new Error(`Invalid string format: ${stringResult.error.issues.map(i => i.message).join(", ")}`);
        }

        // Parse string format: "ENTER-LONG_BINANCE_BTCUSDT_Sample_4M_uuid"
        const parts = body.split("_");
        if (parts.length < 3) {
            throw new Error("Invalid string format: Not enough parts separated by underscore");
        }

        const [actionPart, , symbolPart, ...messageParts] = parts;

        // Convert action format: "ENTER-LONG" -> "ENTER_LONG"
        const action = actionPart.replace("-", "_") as WebhookPayload["action"];
        const symbol = symbolPart.toUpperCase();
        const message = messageParts.join("_") || undefined;

        // Validate the parsed data
        const result = WebhookPayloadSchema.safeParse({
            action,
            symbol,
            message,
        });

        if (!result.success) {
            throw new Error(`Invalid parsed data from string: ${result.error.issues.map(i => i.message).join(", ")}`);
        }

        return result.data;
    }

    throw new Error("Invalid payload: Must be JSON object or string");
}

/**
 * Validate webhook payload
 * 
 * @param payload - Webhook payload to validate
 * @returns Validation result with errors if any
 */
export function validateSignalPayload(payload: WebhookPayload): {
    isValid: boolean;
    errors?: string[];
} {
    const result = WebhookPayloadSchema.safeParse(payload);

    if (!result.success) {
        return {
            isValid: false,
            errors: result.error.issues.map(issue => issue.message),
        };
    }

    return { isValid: true };
}

/**
 * Create signal record in database
 * 
 * @param botId - Signal bot ID
 * @param payload - Validated webhook payload
 * @returns Created signal record
 */
export async function createSignalRecord(
    botId: string,
    payload: WebhookPayload
): Promise<Signal> {
    const signal = await db.signal.create({
        data: {
            botId,
            action: payload.action,
            symbol: payload.symbol,
            price: payload.price ?? null,
            message: payload.message ?? null,
            processed: false,
            visibleToCustomer: true,
        },
    });

    console.log("[Signal Utils] Signal record created:", {
        id: signal.id,
        botId: signal.botId,
        action: signal.action,
        symbol: signal.symbol,
    });

    return signal;
}

/**
 * Mark signal as processed with result
 * 
 * @param signalId - Signal ID
 * @param result - Trading result from execution
 */
export async function markSignalProcessed(
    signalId: string,
    result: TradingResult
): Promise<void> {
    const updateData: {
        processed: boolean;
        processedAt: Date;
        error?: string;
        positionId?: string;
        ordersFilled?: number;
    } = {
        processed: true,
        processedAt: new Date(),
    };

    if (result.success) {
        updateData.positionId = result.positionId ?? undefined;
        updateData.ordersFilled = result.orderId ? 1 : 0;

        console.log("[Signal Utils] Marking signal as processed (success):", {
            signalId,
            positionId: result.positionId,
        });
    } else {
        updateData.error = result.error || "Unknown error";

        console.log("[Signal Utils] Marking signal as processed (failed):", {
            signalId,
            error: result.error,
        });
    }

    await db.signal.update({
        where: { id: signalId },
        data: updateData,
    });
}

/**
 * Get signal by ID with bot information
 * 
 * @param signalId - Signal ID
 * @returns Signal with bot, portfolio, and exchange
 */
export async function getSignalWithBot(signalId: string) {
    const signal = await db.signal.findUnique({
        where: { id: signalId },
        include: {
            bot: {
                include: {
                    portfolio: true,
                    exchange: true,
                },
            },
        },
    });

    if (!signal) {
        throw new Error(`Signal not found: ${signalId}`);
    }

    if (!signal.bot.isActive) {
        throw new Error(`Bot is not active: ${signal.bot.id}`);
    }

    return signal;
}
