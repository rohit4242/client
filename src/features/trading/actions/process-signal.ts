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
import { getSignalWithBot, markSignalProcessed } from "../utils/signal-utils";

/**
 * Process signal action (Webhook)
 * 
 * Used by webhook endpoint to process trading signals
 * Now works with signal ID instead of payload, fetches signal from database
 * 
 * @param signalId - Signal ID from database
 * @returns Trading result
 */
export async function processSignalAction(
    signalId: string
): Promise<TradingResult> {
    let signal;

    try {
        // Fetch signal with bot, portfolio, and exchange
        signal = await getSignalWithBot(signalId);

        const { bot } = signal;

        console.log("[Process Signal] Processing signal:", {
            signalId: signal.id,
            botId: bot.id,
            action: signal.action,
            symbol: signal.symbol,
        });

        // Determine account type and side effect type based on bot config
        const accountType = bot.accountType === "MARGIN" ? "MARGIN" : "SPOT";
        const sideEffectType = bot.accountType === "MARGIN"
            ? (bot.sideEffectType as "NO_SIDE_EFFECT" | "MARGIN_BUY" | "AUTO_REPAY" || "AUTO_REPAY")
            : "NO_SIDE_EFFECT";

        // Calculate quantity based on bot configuration
        const tradeAmount = bot.tradeAmount?.toString();
        const isBase = bot.tradeAmountType === "BASE";

        // Build trading request
        const tradingRequest: TradingRequest = {
            userId: bot.portfolio.userId,
            portfolioId: bot.portfolioId,
            source: "BOT",
            botId: bot.id,
            exchange: {
                id: bot.exchange.id,
                apiKey: bot.exchange.apiKey,
                apiSecret: bot.exchange.apiSecret,
            },
            order: {
                action: signal.action as SignalAction,
                symbol: signal.symbol.toUpperCase(),
                type: bot.orderType === "LIMIT" ? "LIMIT" : "MARKET",
                accountType,
                quoteOrderQty: isBase ? undefined : tradeAmount,
                quantity: isBase ? tradeAmount : undefined,
                sideEffectType,
                stopLoss: bot.stopLoss || undefined,
                takeProfit: bot.takeProfit || undefined,
            },
        };

        // Execute via unified trading engine
        const result = await executeTradingRequest(tradingRequest);

        // Update signal with result
        await markSignalProcessed(signalId, result);

        console.log("[Process Signal] Signal processing complete:", {
            signalId,
            success: result.success,
            positionId: result.positionId,
        });

        return result;
    } catch (error) {
        console.error("[Process Signal] Error:", error);

        const errorResult: TradingResult = {
            success: false,
            error: error instanceof Error ? error.message : "Failed to process signal",
        };

        // Update signal with error if we have signal ID
        if (signal?.id) {
            try {
                await markSignalProcessed(signal.id, errorResult);
            } catch (updateError) {
                console.error("[Process Signal] Failed to update signal status:", updateError);
            }
        }

        return errorResult;
    }
}