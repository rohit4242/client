/**
 * TP/SL Monitor - Position Closer Service
 * 
 * Handles closing positions when TP/SL triggers.
 * Manages execution queue, places market orders, and updates database.
 */

import { db } from "@/lib/db/client";
import { closePositionAction } from "@/features/trading/actions/close-position";
import { MonitoredPosition, CloseRequest } from "./types";

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
    async queueClose(positionId: string, reason: 'TAKE_PROFIT' | 'STOP_LOSS'): Promise<void> {
        // Prevent duplicate close requests
        if (this.closeQueue.has(positionId)) {
            console.log(`[PositionCloser] Position ${positionId} already queued, skipping`);
            return;
        }

        const request: CloseRequest = {
            positionId,
            reason,
            timestamp: new Date()
        };

        this.closeQueue.set(positionId, request);

        console.log(`[PositionCloser] Queued ${positionId} for ${reason} (queue size: ${this.closeQueue.size})`);

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
        const { positionId, reason } = request;

        console.log(`[PositionCloser] Closing position ${positionId} (${reason})`);

        try {
            // Call the working close action
            const result = await closePositionAction({
                positionId
            });

            if (!result.success) {
                throw new Error(result.error || 'Failed to close position');
            }

            // Remove from monitoring
            if (this.onPositionClosed) {
                this.onPositionClosed(positionId);
            }

            console.log(`[PositionCloser] ✅ Successfully closed position ${positionId}`);
        } catch (error: any) {
            console.error(`[PositionCloser] Failed to close ${positionId}:`, error);

            const retries = this.retryCount.get(positionId) || 0;
            const isPermanentFailure = retries >= this.MAX_RETRIES - 1;

            // Update position with warning message
            await db.position.update({
                where: { id: positionId },
                data: {
                    warningMessage: isPermanentFailure
                        ? `⚠️ TP/SL Failed (Max Retries): ${error.message || 'Unknown error'}`.substring(0, 190)
                        : `⚠️ TP/SL Exit Failed (Retry ${retries + 1}/${this.MAX_RETRIES}): ${error.message}`.substring(0, 190)
                }
            }).catch(dbError => {
                console.error(`[PositionCloser] Failed to update position warning:`, dbError);
            });

            throw error;
        }
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
