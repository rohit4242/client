/**
 * Trading System - Core Types
 * 
 * Shared types for unified trading engine that handles both
 * manual trading and webhook signals.
 */

import { Side, OrderType, AccountType, SideEffectType } from "@prisma/client";

// ============================================================================
// REQUEST TYPES
// ============================================================================

/**
 * Signal actions from webhooks (e.g., TradingView)
 */
export type SignalAction = "ENTER_LONG" | "EXIT_LONG" | "ENTER_SHORT" | "EXIT_SHORT";

/**
 * Trading source (who initiated the trade)
 */
export type TradingSource = "MANUAL" | "SIGNAL_BOT";

/**
 * Main trading request interface
 * Used by both manual trading and webhook signals
 */
export interface TradingRequest {
    // User & source
    userId: string;
    portfolioId: string;
    source: TradingSource;
    botId?: string; // Required if source = SIGNAL_BOT

    // Exchange credentials
    exchange: {
        id: string;
        apiKey: string;
        apiSecret: string;
    };

    // Order details
    order: {
        // Signal format (webhook)
        action?: SignalAction;

        // Manual format
        side?: "BUY" | "SELL";

        // Common fields
        symbol: string;
        type: "MARKET" | "LIMIT";
        accountType: "SPOT" | "MARGIN";

        // Quantity specifications
        quantity?: string; // Base asset quantity (e.g., "0.1" BTC)
        quoteOrderQty?: string; // Quote asset amount (e.g., "1000" USDT)
        price?: string; // Limit order price

        // Margin specific
        sideEffectType?: "NO_SIDE_EFFECT" | "MARGIN_BUY" | "AUTO_REPAY";

        // Optional parameters
        timeInForce?: "GTC" | "IOC" | "FOK";

        // Protective orders
        stopLoss?: number; // Percentage (e.g., 2 = 2%)
        takeProfit?: number; // Percentage (e.g., 5 = 5%)
    };
}

/**
 * Normalized trading request (after signal → manual conversion)
 */
export interface NormalizedTradingRequest extends Omit<TradingRequest, "order"> {
    order: {
        symbol: string;
        side: "BUY" | "SELL"; // Always present after normalization
        type: "MARKET" | "LIMIT";
        accountType: "SPOT" | "MARGIN";
        quantity?: string;
        quoteOrderQty?: string;
        price?: string;
        sideEffectType?: "NO_SIDE_EFFECT" | "MARGIN_BUY" | "AUTO_REPAY";
        timeInForce?: "GTC" | "IOC" | "FOK";
        stopLoss?: number;
        takeProfit?: number;
    };
}

// ============================================================================
// RESULT TYPES
// ============================================================================

/**
 * Trading execution result
 */
export interface TradingResult {
    success: boolean;
    positionId?: string;
    orderId?: string;
    executedQty?: number;
    executedPrice?: number;
    error?: string;
    validationErrors?: string[];
}

/**
 * Validation result from trading request validation
 */
export interface ValidationResult {
    isValid: boolean;
    errors?: string[];
    data?: ValidationData;
}

/**
 * Validation data collected during validation
 */
export interface ValidationData {
    currentPrice: number;
    availableBalance: number;
    maxBorrowable?: number;
    symbolFilters: {
        minPrice: string;
        maxPrice: string;
        tickSize: string;
        minQty: string;
        maxQty: string;
        stepSize: string;
        minNotional: string;
    };
}

/**
 * Calculated trade parameters
 */
export interface TradeParams {
    // Calculated quantities
    quantity?: string; // Base asset quantity
    quoteOrderQty?: string; // Quote asset amount

    // Price information
    expectedPrice: number; // Expected execution price
    price?: string; // Limit order price

    // Execution details
    executedPrice?: number; // Actual execution price (filled later)

    // Protective orders
    stopLossPrice?: number;
    takeProfitPrice?: number;
}

// ============================================================================
// DATABASE TYPES
// ============================================================================

/**
 * Position creation data
 */
export interface CreatePositionData {
    portfolioId: string;
    symbol: string;
    side: "LONG" | "SHORT";
    type: "MARKET" | "LIMIT";
    accountType: "SPOT" | "MARGIN";
    entryPrice: number;
    quantity: number;
    status: "PENDING" | "OPEN";
    source: TradingSource;
    botId?: string | null;
    sideEffectType?: "NO_SIDE_EFFECT" | "MARGIN_BUY" | "AUTO_REPAY";
}

/**
 * Order creation data
 */
export interface CreateOrderData {
    positionId: string;
    portfolioId: string;
    orderId: string;
    clientOrderId?: string;
    symbol: string;
    side: Side;
    type: "ENTRY" | "EXIT" | "STOP_LOSS" | "TAKE_PROFIT";
    orderType: OrderType;
    status: string;
    price: number;
    quantity: number;
    executedQty: number;
    cummulativeQuoteQty: number;
    accountType: AccountType;
    sideEffectType?: SideEffectType;
    transactTime?: Date;
}
