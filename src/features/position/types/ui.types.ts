/**
 * Position UI Types
 * 
 * TypeScript types for UI components related to Positions.
 */

import { PositionStatus } from "@prisma/client";

// UI-friendly types for display
export type PositionSideDisplay = "Long" | "Short";
export type PositionStatusDisplay = "ENTERED" | "OPEN" | "CLOSED" | "CANCELED" | "FAILED" | "PENDING" | "PARTIALLY_FILLED";

export interface PositionFilters {
    exchange?: string;
    symbol?: string;
    status?: string; // Can be DB status or UI status
    side?: PositionSideDisplay;
    strategy?: string;
    dateRange?: {
        from: Date;
        to: Date;
    };
}

// Market Close Request
export interface MarketCloseRequest {
    positionId: string;
    closeType: "FULL" | "PARTIAL";
    quantity?: number; // For partial close
    price?: number; // For limit close orders
    slippage?: number; // Max allowed slippage percentage
}

// Position Action Types
export type PositionAction =
    | { type: "CLOSE_POSITION"; payload: MarketCloseRequest }
    | { type: "UPDATE_STOP_LOSS"; payload: { positionId: string; stopLoss: number } }
    | { type: "UPDATE_TAKE_PROFIT"; payload: { positionId: string; takeProfit: number } }
    | { type: "UPDATE_TRAILING"; payload: { positionId: string; trailing: number } }
    | { type: "ADD_TO_POSITION"; payload: { positionId: string; quantity: number } }
    | { type: "REDUCE_POSITION"; payload: { positionId: string; quantity: number } };

// Order types (matching Prisma schema but for UI use)
export type OrderType = "ENTRY" | "EXIT" | "STOP_LOSS" | "TAKE_PROFIT";
export type OrderSide = "BUY" | "SELL";
export type OrderOrderType = "MARKET" | "LIMIT";
export type OrderStatus = "NEW" | "PENDING" | "FILLED" | "COMPLETED" | "CANCELED" | "REJECTED" | "PARTIALLY_FILLED";

// UI-friendly position order interface
export interface PositionOrder {
    id: string;
    type: OrderType;
    side: OrderSide;
    price: number;
    amount: number; // Same as quantity
    filled: number; // Calculated from fillPercent
    remaining: number; // quantity - filled
    createdAt: Date;
    lastUpdatedAt: Date;
    status: OrderStatus;
    fill: number; // Fill percentage (0-100)
    volume: number; // Volume in USD (same as value)
    pnl: number;
    fees?: number;
    averagePrice?: number;
}
