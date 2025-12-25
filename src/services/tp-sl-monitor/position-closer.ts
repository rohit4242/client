/**
 * TP/SL Monitor - Position Closer Service
 * 
 * Handles closing positions when TP/SL triggers.
 * Manages execution queue, places market orders, and updates database.
 */

import { db } from "@/lib/db/client";
import { createSpotClient, createMarginClient } from "@/features/binance/sdk/client";
import { placeSpotMarketOrder, placeMarginMarketOrder } from "@/features/binance";
import { MonitoredPosition, CloseRequest } from "./types";
import type { BinanceOrderResponse } from "@/features/binance";

/**
 * Position Closer Service
 * Queues and executes position closes
 */
export class PositionCloserService {
    // Queue of positions waiting to be closed
    private closeQueue: Map<string, CloseRequest> = new Map();

    // Currently processing flag
    private processing = false;

    // Callback to remove position from monitoring
    private onPositionClosed?: (positionId: string) => void;

    // Retry tracking: positionId -> retry count
    private retryCount: Map<string, number> = new Map();
    private readonly MAX_RETRIES = 3;

    constructor() {
        console.log('[PositionCloser] Service initialized');
    }

    /**
     * Set callback for when position is closed
     */
    setClosedCallback(callback: (positionId: string) => void) {
        this.onPositionClosed = callback;
    }

    /**
     * Queue a position for closing
     */
    async queueClose(position: MonitoredPosition, currentPrice: number, reason: 'TAKE_PROFIT' | 'STOP_LOSS'): Promise<void> {
        // Prevent duplicate close requests
        if (this.closeQueue.has(position.id)) {
            console.log(`[PositionCloser] Position ${position.id} already queued, skipping`);
            return;
        }

        const request: CloseRequest = {
            positionId: position.id,
            position,
            currentPrice,
            reason,
            timestamp: new Date()
        };

        this.closeQueue.set(position.id, request);

        console.log(`[PositionCloser] Queued ${position.id} for ${reason} at ${currentPrice} (queue size: ${this.closeQueue.size})`);

        // Start processing if not already running
        if (!this.processing) {
            this.processQueue();
        }
    }

    /**
     * Process the close queue
     */
    private async processQueue(): Promise<void> {
        this.processing = true;

        while (this.closeQueue.size > 0) {
            const entry = Array.from(this.closeQueue.entries())[0];
            if (!entry) break;
            const [positionId, request] = entry;
            this.closeQueue.delete(positionId);

            try {
                await this.closePosition(request);
                // Success! Clear retry count
                this.retryCount.delete(positionId);
            } catch (error) {
                console.error(`[PositionCloser] Failed to close ${positionId}:`, error);

                // Track retry count
                const currentRetries = this.retryCount.get(positionId) || 0;
                const newRetries = currentRetries + 1;
                this.retryCount.set(positionId, newRetries);

                console.log(`[PositionCloser] Retry count for ${positionId}: ${newRetries}/${this.MAX_RETRIES}`);

                // If max retries exceeded, remove from monitoring
                if (newRetries >= this.MAX_RETRIES) {
                    console.error(`[PositionCloser] ❌ Max retries (${this.MAX_RETRIES}) exceeded for ${positionId}. Removing from monitoring.`);
                    this.retryCount.delete(positionId);

                    // Remove from monitoring to stop infinite retries
                    if (this.onPositionClosed) {
                        this.onPositionClosed(positionId);
                    }
                }
                // Otherwise, position remains in monitoring and will retry on next price update
            }

            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        this.processing = false;
    }

    /**
     * Close a single position
     */
    private async closePosition(request: CloseRequest): Promise<void> {
        const { position, currentPrice, reason } = request;

        console.log(`[PositionCloser] Closing position ${position.id} (${reason})`);

        try {
            // 1. Fetch exchange credentials
            const exchange = await db.exchange.findFirst({
                where: {
                    portfolioId: position.portfolioId,
                    isActive: true
                }
            });

            if (!exchange) {
                throw new Error(`No active exchange found for portfolio ${position.portfolioId}`);
            }

            // 2. Execute market close order
            const closeResult = await this.executeCloseOrder(position, exchange, currentPrice);

            if (!closeResult.success || !closeResult.data) {
                throw new Error(`Failed to execute close order: ${closeResult.error}`);
            }

            // 3. Update database
            await this.updateDatabase(position, closeResult.data, reason, currentPrice);

            // 4. Notify that position is closed (remove from monitoring)
            if (this.onPositionClosed) {
                this.onPositionClosed(position.id);
            }

            console.log(`[PositionCloser] ✅ Successfully closed position ${position.id}`);
        } catch (error: any) {
            console.error(`[PositionCloser] Failed to close ${position.id}:`, error);

            const retries = this.retryCount.get(position.id) || 0;
            const isPermanentFailure = retries >= this.MAX_RETRIES - 1; // Will hit max on next attempt

            // Update position with warning message
            await db.position.update({
                where: { id: position.id },
                data: {
                    warningMessage: isPermanentFailure
                        ? `⚠️ TP/SL Failed (Max Retries): ${error.message || 'Unknown error'}`.substring(0, 190)
                        : `⚠️ TP/SL Exit Failed (Retry ${retries + 1}/${this.MAX_RETRIES}): ${error.message}`.substring(0, 190)
                }
            }).catch(dbError => {
                console.error(`[PositionCloser] Failed to update position warning:
`, dbError);
            });

            throw error; // Re-throw to ensure processQueue knows it failed
        }
    }

    /**
     * Execute the close order on Binance
     */
    private async executeCloseOrder(
        position: MonitoredPosition,
        exchange: { apiKey: string; apiSecret: string },
        currentPrice: number
    ) {
        // Determine order side (opposite of entry)
        const orderSide = position.side === 'LONG' ? 'SELL' : 'BUY';

        // Place market order based on account type
        if (position.accountType === 'SPOT') {
            const client = createSpotClient({
                apiKey: exchange.apiKey,
                apiSecret: exchange.apiSecret
            });

            return await placeSpotMarketOrder(client, {
                symbol: position.symbol,
                side: orderSide,
                quantity: position.quantity.toString()
            });
        } else {
            // MARGIN
            const client = createMarginClient({
                apiKey: exchange.apiKey,
                apiSecret: exchange.apiSecret
            });

            return await placeMarginMarketOrder(client, {
                symbol: position.symbol,
                side: orderSide,
                quantity: position.quantity.toString(),
                sideEffectType: 'AUTO_REPAY' // Auto repay borrowed funds
            });
        }
    }

    /**
     * Update database after successful close
     */
    private async updateDatabase(
        position: MonitoredPosition,
        closeResult: BinanceOrderResponse,
        reason: 'TAKE_PROFIT' | 'STOP_LOSS',
        currentPrice: number
    ): Promise<void> {
        // Extract execution details
        const executedQty = parseFloat(closeResult.executedQty || '0');
        const cumulativeQuoteQty = parseFloat(closeResult.cummulativeQuoteQty || '0');

        // Calculate exit price
        let exitPrice = currentPrice;
        if (executedQty > 0 && cumulativeQuoteQty > 0) {
            exitPrice = cumulativeQuoteQty / executedQty;
        }

        const exitValue = cumulativeQuoteQty;

        // Calculate PnL
        let pnl: number;
        if (position.side === 'LONG') {
            pnl = (exitPrice - position.entryPrice) * position.quantity;
        } else {
            pnl = (position.entryPrice - exitPrice) * position.quantity;
        }

        const pnlPercent = position.entryValue > 0
            ? (pnl / position.entryValue) * 100
            : 0;

        // Use transaction to ensure atomicity
        await db.$transaction(async (tx) => {
            // Update position
            await tx.position.update({
                where: { id: position.id },
                data: {
                    status: 'CLOSED',
                    exitPrice,
                    exitValue,
                    pnl,
                    pnlPercent,
                    closedAt: new Date(),
                    currentPrice: exitPrice
                }
            });

            // Create order record
            await tx.order.create({
                data: {
                    positionId: position.id,
                    portfolioId: position.portfolioId,
                    orderId: closeResult.orderId.toString(),
                    clientOrderId: closeResult.clientOrderId,
                    symbol: position.symbol,
                    side: closeResult.side as 'BUY' | 'SELL',
                    type: 'EXIT',
                    orderType: 'MARKET',
                    price: exitPrice,
                    quantity: executedQty,
                    value: exitValue,
                    executedQty: executedQty,
                    cummulativeQuoteQty: cumulativeQuoteQty,
                    status: 'FILLED',
                    fillPercent: 100,
                    accountType: position.accountType,
                    transactTime: new Date()
                }
            });
        });

        // Recalculate portfolio stats asynchronously
        this.recalculateStatsAsync(position.portfolio.userId);

        console.log(`[PositionCloser] Updated database for ${position.id}: PnL ${pnl.toFixed(2)} (${pnlPercent.toFixed(2)}%)`);
    }

    /**
     * Recalculate portfolio stats without blocking
     */
    private recalculateStatsAsync(userId: string): void {
        setImmediate(async () => {
            try {
                const { recalculatePortfolioStatsInternal } = await import('@/db/actions/portfolio/recalculate-stats');
                await recalculatePortfolioStatsInternal(userId);
            } catch (error) {
                console.error('[PositionCloser] Failed to recalculate portfolio stats:', error);
            }
        });
    }

    /**
     * Get current queue status
     */
    getQueueStatus() {
        return {
            queueSize: this.closeQueue.size,
            processing: this.processing,
            pendingPositions: Array.from(this.closeQueue.keys())
        };
    }
}
