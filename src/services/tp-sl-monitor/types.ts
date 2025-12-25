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
 * Helper function to map database position to MonitoredPosition
 * Eliminates code duplication across the codebase
 */
export function mapToMonitoredPosition(dbPosition: {
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
    portfolio: { userId: string };
}): MonitoredPosition {
    return {
        id: dbPosition.id,
        symbol: dbPosition.symbol,
        side: dbPosition.side,
        stopLoss: dbPosition.stopLoss,
        takeProfit: dbPosition.takeProfit,
        accountType: dbPosition.accountType,
        quantity: dbPosition.quantity,
        entryPrice: dbPosition.entryPrice,
        entryValue: dbPosition.entryValue,
        portfolioId: dbPosition.portfolioId,
        portfolio: {
            userId: dbPosition.portfolio.userId
        }
    };
}

/**
 * Request to close a position
 */
export interface CloseRequest {
    positionId: string;
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
