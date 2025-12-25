/**
 * Webhook API Route - Signal Bot
 * 
 * Receives webhook signals from external sources (TradingView, custom scripts)
 * Creates signal record in database and triggers async processing
 * 
 * POST /api/webhook/signal-bot/[botId]
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { parseWebhookPayload, createSignalRecord } from "@/features/trading/utils/signal-utils";
import { processSignalAction } from "@/features/trading/actions/process-signal";

/**
 * POST handler for webhook signals
 * 
 * Accepts JSON or string format payloads
 * Returns 202 Accepted immediately while processing asynchronously
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ botId: string }> }
) {
    try {
        const { botId } = await params;

        console.log("[Webhook] Received signal for bot:", botId);

        // Parse request body (JSON or text)
        const contentType = request.headers.get("content-type") || "";
        let body: string | object;

        if (contentType.includes("application/json")) {
            body = await request.json();
        } else {
            body = await request.text();
        }

        console.log("[Webhook] Request body:", typeof body === "string" ? body : JSON.stringify(body));

        // Validate bot exists and is active
        const bot = await db.bot.findUnique({
            where: { id: botId },
            select: {
                id: true,
                isActive: true,
                name: true,
            },
        });

        if (!bot) {
            console.error("[Webhook] Bot not found:", botId);
            return NextResponse.json(
                {
                    success: false,
                    error: "Bot not found",
                    code: "WEBHOOK_INVALID_BOT",
                },
                { status: 404 }
            );
        }

        if (!bot.isActive) {
            console.error("[Webhook] Bot is inactive:", botId);
            return NextResponse.json(
                {
                    success: false,
                    error: "Bot is not active",
                    code: "WEBHOOK_BOT_INACTIVE",
                },
                { status: 403 }
            );
        }

        // Parse and validate webhook payload
        let payload;
        try {
            payload = parseWebhookPayload(body);
            console.log("[Webhook] Parsed payload:", payload);
        } catch (error) {
            console.error("[Webhook] Invalid payload:", error);
            return NextResponse.json(
                {
                    success: false,
                    error: error instanceof Error ? error.message : "Invalid payload format",
                    code: "WEBHOOK_INVALID_PAYLOAD",
                },
                { status: 400 }
            );
        }

        // Create signal record in database
        const signal = await createSignalRecord(botId, payload);

        console.log("[Webhook] Signal record created:", signal.id);

        // Process signal SYNCHRONOUSLY (await it)
        // This ensures all signals are processed even when multiple arrive simultaneously
        const result = await processSignalAction(signal.id);

        // Return error if processing failed
        if (!result.success) {
            console.error("[Webhook] Signal processing failed:", signal.id, result.error);
            return NextResponse.json(
                {
                    success: false,
                    error: result.error,
                    signalId: signal.id,
                    action: signal.action,
                    symbol: signal.symbol,
                },
                { status: 500 }
            );
        }

        // Return success after processing completes
        console.log("[Webhook] Signal processed successfully:", signal.id);
        return NextResponse.json(
            {
                success: true,
                message: "Signal processed successfully",
                signalId: signal.id,
                action: signal.action,
                symbol: signal.symbol,
                positionId: result.positionId,
                orderId: result.orderId,
            },
            { status: 200 }
        );

    } catch (error) {
        console.error("[Webhook] Unexpected error:", error);

        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Internal server error",
                code: "WEBHOOK_PROCESSING_FAILED",
            },
            { status: 500 }
        );
    }
}

/**
 * GET handler - Returns webhook information and recent signals
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ botId: string }> }
) {
    try {
        const { botId } = await params;

        const bot = await db.bot.findUnique({
            where: { id: botId },
            select: {
                id: true,
                name: true,
                isActive: true,
            },
        });

        if (!bot) {
            return NextResponse.json(
                { success: false, error: "Bot not found" },
                { status: 404 }
            );
        }

        // Get recent signals for this bot
        const recentSignals = await db.signal.findMany({
            where: { botId },
            orderBy: { createdAt: "desc" },
            take: 10,
            select: {
                id: true,
                action: true,
                symbol: true,
                processed: true,
                processedAt: true,
                error: true,
                createdAt: true,
            },
        });

        return NextResponse.json({
            success: true,
            bot: {
                id: bot.id,
                name: bot.name,
                isActive: bot.isActive,
            },
            webhookUrl: `${request.nextUrl.origin}/api/webhook/signal-bot/${botId}`,
            recentSignals,
        });

    } catch (error) {
        console.error("[Webhook] GET error:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
