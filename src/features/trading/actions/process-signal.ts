/**
 * Trading Action - Process Signal (Webhook)
 * 
 * Server action for processing webhook signals
 * Uses the unified trading engine
 */

"use server";

import { db } from "@/lib/db/client";
import { executeTradingRequest } from "../engine";
import type { TradingRequest, TradingResult, SignalAction } from "../types/trading.types";

export interface WebhookPayload {
    action: string;
    symbol: string;
    price?: number;
    message?: string;
}

/**
 * Process signal action (Webhook)
 * 
 * Used by webhook endpoint to process trading signals
 * 
 * @param botId - Signal bot ID
 * @param payload - Webhook payload
 * @returns Trading result
 */
export async function processSignalAction(
    botId: string,
    payload: WebhookPayload
): Promise<TradingResult> {
    try {
        // Get bot with exchange and portfolio
        const bot = await db.bot.findUnique({
            where: { id: botId, isActive: true },
            include: {
                portfolio: true,
                exchange: true,
            },
        });

        if (!bot) {
            return {
                success: false,
                error: "Bot not found or inactive",
            };
        }

        // Normalize action to SignalAction type
        const action = normalizeSignalAction(payload.action);

        // Determine account type and side effect type based on bot config
        const accountType = bot.accountType === "MARGIN" ? "MARGIN" : "SPOT";
        const sideEffectType = bot.accountType === "MARGIN"
            ? (bot.sideEffectType as "NO_SIDE_EFFECT" | "MARGIN_BUY" | "AUTO_REPAY" || "AUTO_REPAY")
            : "NO_SIDE_EFFECT";

        // Calculate quantity based on bot configuration
        // This will be handled by the validation layer using bot settings
        const quoteOrderQty = bot.tradeAmount?.toString();

        // Build trading request
        const tradingRequest: TradingRequest = {
            userId: bot.portfolio.userId,  // FIXED: Access userId through portfolio
            portfolioId: bot.portfolioId,
            source: "SIGNAL_BOT",
            botId: bot.id,
            exchange: {
                id: bot.exchange.id,
                apiKey: bot.exchange.apiKey,
                apiSecret: bot.exchange.apiSecret,
            },
            order: {
                action, // Signal action (ENTER_LONG, EXIT_LONG, etc.)
                symbol: payload.symbol.toUpperCase(),
                type: "MARKET", // Signals always use market orders for fast execution
                accountType,
                quoteOrderQty, // Use bot's configured trade amount
                sideEffectType,
                stopLoss: bot.stopLoss || undefined,
                takeProfit: bot.takeProfit || undefined,
            },
        };

        // Execute via SAME unified trading engine as manual trading
        const result = await executeTradingRequest(tradingRequest);

        return result;
    } catch (error) {
        console.error("[Process Signal] Error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to process signal",
        };
    }
}

/**
 * Normalize webhook action to SignalAction type
 */
function normalizeSignalAction(action: string): SignalAction {
    const normalized = action.toUpperCase().replace(/-/g, "_");

    const actionMap: Record<string, SignalAction> = {
        ENTER_LONG: "ENTER_LONG",
        ENTERLONG: "ENTER_LONG",
        LONG: "ENTER_LONG",
        BUY: "ENTER_LONG",

        EXIT_LONG: "EXIT_LONG",
        EXITLONG: "EXIT_LONG",
        CLOSE_LONG: "EXIT_LONG",
        CLOSELONG: "EXIT_LONG",
        SELL_LONG: "EXIT_LONG",
        SELL: "EXIT_LONG",

        ENTER_SHORT: "ENTER_SHORT",
        ENTERSHORT: "ENTER_SHORT",
        SHORT: "ENTER_SHORT",

        EXIT_SHORT: "EXIT_SHORT",
        EXITSHORT: "EXIT_SHORT",
        CLOSE_SHORT: "EXIT_SHORT",
        CLOSESHORT: "EXIT_SHORT",
        BUY_SHORT: "EXIT_SHORT",
        COVER: "EXIT_SHORT",
    };

    const result = actionMap[normalized];

    if (!result) {
        throw new Error(`Invalid signal action: ${action}`);
    }

    return result;
}
