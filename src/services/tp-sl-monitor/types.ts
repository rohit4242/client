/**
 * TP/SL Monitor - Type Definitions
 * 
 * Types for the take profit and stop loss monitoring system.
 */

import { AccountType, Side } from "@prisma/client";

/**
 * Position data tracked by the monitor
 */
export interface MonitoredPosition {
    id: string;
    symbol: string;
    side: Side;
    stopLoss: number | null;
    takeProfit: number | null;
    accountType: AccountType;
    quantity: number;
    entryPrice: number;
    entryValue: number;
    portfolioId: string;
    portfolio: {
        userId: string;
    };
}

/**
 * Request to close a position
 */
export interface CloseRequest {
    positionId: string;
    position: MonitoredPosition;
    currentPrice: number;
    reason: 'TAKE_PROFIT' | 'STOP_LOSS';
    timestamp: Date;
}

/**
 * Symbol price info
 */
export interface SymbolPriceInfo {
    symbol: string;
    lastPrice: number;
    lastUpdate: Date;
}

/**
 * Monitor statistics
 */
export interface MonitorStats {
    monitoredPositions: number;
    activeSymbols: number;
    symbols: string[];
    isConnected: boolean;
    reconnectAttempts: number;
    uptime: number;
}
