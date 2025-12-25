/**
 * TP/SL Monitor - Main Entry Point
 * 
 * Lifecycle management for the TP/SL monitoring system.
 * Initializes services, loads positions, and provides API for integration.
 */

import { db } from "@/lib/db/client";
import { PriceMonitorService } from "./price-monitor";
import { PositionCloserService } from "./position-closer";
import type { MonitoredPosition, MonitorStats } from "./types";
import { mapToMonitoredPosition } from "./types";

// Service instances
let priceMonitor: PriceMonitorService;
let positionCloser: PositionCloserService;
let initialized = false;
let startTime: Date;

/**
 * Initialize the TP/SL monitoring system
 * Called once on server startup
 */
export async function initializeTPSLMonitoring(): Promise<void> {
    if (initialized) {
        return; // Silent return - already initialized
    }

    console.log('[TPSL Monitor] Initializing...');
    startTime = new Date();

    try {
        // Initialize services
        priceMonitor = new PriceMonitorService();
        positionCloser = new PositionCloserService();

        // Wire up callbacks
        priceMonitor.setTriggerCallback((positionId, reason) => {
            positionCloser.queueClose(positionId, reason);
        });

        positionCloser.setClosedCallback((positionId) => {
            priceMonitor.removePosition(positionId);
        });

        // Load all open positions with TP/SL
        const positions = await db.position.findMany({
            where: {
                status: 'OPEN',
                OR: [
                    { stopLoss: { not: null } },
                    { takeProfit: { not: null } }
                ]
            },
            include: {
                portfolio: {
                    select: {
                        userId: true
                    }
                }
            }
        });

        console.log(`[TPSL Monitor] Found ${positions.length} positions to monitor`);

        // Add each position to monitoring
        for (const position of positions) {
            const monitoredPosition = mapToMonitoredPosition(position);
            await priceMonitor.addPosition(monitoredPosition);
        }

        initialized = true;
        console.log(`[TPSL Monitor] ✅ Initialized - monitoring ${positions.length} positions`);

    } catch (error) {
        console.error('[TPSL Monitor] ❌ Initialization failed:', error);
        throw error;
    }
}

/**
 * Start monitoring a newly created position
 * Called when a position is created with TP/SL
 */
export async function startMonitoringPosition(positionId: string): Promise<void> {
    if (!initialized) {
        try {
            await initializeTPSLMonitoring();
        } catch (error) {
            console.error('[TPSL Monitor] ❌ Initialization failed:', error);

            // Update position with user message
            try {
                await db.position.update({
                    where: { id: positionId },
                    data: {
                        warningMessage: "⚠️ TP/SL monitoring unavailable. Please close position manually when target is hit."
                    }
                });
            } catch { }
            return;
        }
    }

    try {
        // Fetch position from database
        const position = await db.position.findUnique({
            where: { id: positionId },
            include: {
                portfolio: {
                    select: {
                        userId: true
                    }
                }
            }
        });

        if (!position) {
            console.warn(`[TPSL Monitor] Position ${positionId} not found`);
            return;
        }

        // Only monitor if it has TP or SL
        if (!position.stopLoss && !position.takeProfit) {
            return; // Silent skip - expected behavior
        }

        // Add to monitoring
        const monitoredPosition = mapToMonitoredPosition(position);
        await priceMonitor.addPosition(monitoredPosition);

        console.log(`[TPSL Monitor] ✅ Started monitoring ${positionId} (${position.symbol})`);
    } catch (error) {
        console.error(`[TPSL Monitor] ❌ Failed to start monitoring ${positionId}:`, error);

        // Update position with user message
        try {
            await db.position.update({
                where: { id: positionId },
                data: {
                    warningMessage: "⚠️ TP/SL monitoring failed to start. Please close manually when target is hit."
                }
            });
        } catch { }
    }
}

/**
 * Stop monitoring a position
 * Called when a position is manually closed
 */
export async function stopMonitoringPosition(positionId: string): Promise<void> {
    if (!initialized) {
        return;
    }

    try {
        await priceMonitor.removePosition(positionId);
        console.log(`[TPSL Monitor] Stopped monitoring position ${positionId}`);
    } catch (error) {
        console.error(`[TPSL Monitor] Failed to stop monitoring ${positionId}:`, error);
    }
}

/**
 * Get current monitoring statistics
 */
export function getMonitoringStats(): MonitorStats {
    if (!initialized) {
        return {
            monitoredPositions: 0,
            activeSymbols: 0,
            symbols: [],
            isConnected: false,
            reconnectAttempts: 0,
            uptime: 0
        };
    }

    const stats = priceMonitor.getStats();
    const uptime = Date.now() - startTime.getTime();

    return {
        monitoredPositions: stats.monitoredPositions,
        activeSymbols: stats.activeSymbols,
        symbols: stats.symbols,
        isConnected: stats.isConnected,
        reconnectAttempts: stats.reconnectAttempts,
        uptime
    };
}

/**
 * Get detailed status information
 */
export function getDetailedStatus() {
    if (!initialized) {
        return {
            initialized: false,
            message: 'Service not initialized'
        };
    }

    const monitorStats = priceMonitor.getStats();
    const closerStatus = positionCloser.getQueueStatus();

    return {
        initialized: true,
        startTime,
        uptime: Date.now() - startTime.getTime(),
        priceMonitor: monitorStats,
        positionCloser: closerStatus
    };
}

/**
 * Graceful shutdown
 * Called when server is shutting down
 */
export async function shutdownTPSLMonitoring(): Promise<void> {
    if (!initialized) {
        return;
    }

    console.log('[TPSL Monitor] Shutting down...');

    try {
        // Close all WebSocket connections
        await priceMonitor.shutdown();

        initialized = false;
        console.log('[TPSL Monitor] Shutdown complete');
    } catch (error) {
        console.error('[TPSL Monitor] Error during shutdown:', error);
    }
}
