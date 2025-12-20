/**
 * Trading Engine - Trade Parameter Calculation
 * 
 * Calculates exact quantities, prices, and parameters for order execution
 * based on bot config (for signals) or user input (for manual).
 */

import type { NormalizedTradingRequest, TradeParams, ValidationData } from "../types/trading.types";
import { formatPrice, formatQuantity, roundToStepSize } from "@/features/binance/utils";

/**
 * Calculate trade parameters for execution
 * 
 * Determines:
 * - Exact quantity to trade
 * - Expected execution price
 * - Quote order amount (if applicable)
 * - Stop loss and take profit prices
 */
export async function calculateTradeParams(
    request: NormalizedTradingRequest,
    validation: ValidationData,
    bot?: any // Optional bot data for fallback
): Promise<TradeParams> {
    const { order } = request;
    const { currentPrice, symbolFilters } = validation;

    let quantity: string | undefined;
    let quoteOrderQty: string | undefined;
    let price: string | undefined;

    // For LIMIT orders, use provided price
    if (order.type === "LIMIT") {
        if (!order.price) {
            throw new Error("Price required for limit orders");
        }
        const tickSize = parseFloat(symbolFilters.tickSize);
        const precision = tickSize < 1 ? Math.abs(Math.round(Math.log10(tickSize))) : 0;
        price = parseFloat(order.price).toFixed(precision);
    }

    // Calculate quantity
    const stepSize = parseFloat(symbolFilters.stepSize);
    const qtyPrecision = stepSize < 1 ? Math.abs(Math.round(Math.log10(stepSize))) : 0;

    if (order.quantity) {
        // Quantity provided directly
        const rawQty = parseFloat(order.quantity);
        const rounded = Math.floor(rawQty / stepSize) * stepSize;
        quantity = rounded.toFixed(qtyPrecision);
    } else if (order.quoteOrderQty) {
        // Quote order qty provided (e.g., spend $1000 USDT)
        const tickSize = parseFloat(symbolFilters.tickSize);
        const pricePrecision = tickSize < 1 ? Math.abs(Math.round(Math.log10(tickSize))) : 0;
        quoteOrderQty = parseFloat(order.quoteOrderQty).toFixed(pricePrecision);

        // Estimate quantity for database record
        const estimatedQty = parseFloat(order.quoteOrderQty) / currentPrice;
        const rounded = Math.floor(estimatedQty / stepSize) * stepSize;
        quantity = rounded.toFixed(qtyPrecision);
    } else {
        throw new Error("Either quantity or quoteOrderQty must be provided");
    }

    // Validate against symbol filters
    const qtyValue = parseFloat(quantity);
    const minQty = parseFloat(symbolFilters.minQty);
    const maxQty = parseFloat(symbolFilters.maxQty);

    if (qtyValue < minQty) {
        throw new Error(`Quantity ${quantity} is below minimum ${minQty}`);
    }
    if (qtyValue > maxQty) {
        throw new Error(`Quantity ${quantity} is above maximum ${maxQty}`);
    }

    // Calculate protective order prices
    let stopLossPrice: number | undefined;
    let takeProfitPrice: number | undefined;

    // Determine TP/SL percentages (Signal > Bot > None)
    // Note: order.stopLoss/takeProfit are numbers (percentages), e.g., 2.5
    const stopLossPercent = order.stopLoss ?? bot?.stopLoss;
    const takeProfitPercent = order.takeProfit ?? bot?.takeProfit;

    if (stopLossPercent) {
        stopLossPrice = calculateStopLossPrice(
            currentPrice,
            stopLossPercent,
            order.side === "BUY" ? "LONG" : "SHORT"
        );
    }

    if (takeProfitPercent) {
        takeProfitPrice = calculateTakeProfitPrice(
            currentPrice,
            takeProfitPercent,
            order.side === "BUY" ? "LONG" : "SHORT"
        );
    }

    return {
        quantity: order.type === "MARKET" && quoteOrderQty ? undefined : quantity,
        quoteOrderQty,
        expectedPrice: order.type === "LIMIT" ? parseFloat(price!) : currentPrice,
        price,
        stopLossPrice,
        takeProfitPrice,
    };
}

/**
 * Calculate stop loss price based on entry price and percentage
 */
export function calculateStopLossPrice(
    entryPrice: number,
    stopLossPercent: number,
    side: "LONG" | "SHORT"
): number {
    if (side === "LONG") {
        return entryPrice * (1 - stopLossPercent / 100);
    } else {
        return entryPrice * (1 + stopLossPercent / 100);
    }
}

/**
 * Calculate take profit price based on entry price and percentage
 */
export function calculateTakeProfitPrice(
    entryPrice: number,
    takeProfitPercent: number,
    side: "LONG" | "SHORT"
): number {
    if (side === "LONG") {
        return entryPrice * (1 + takeProfitPercent / 100);
    } else {
        return entryPrice * (1 - takeProfitPercent / 100);
    }
}

/**
 * Calculate bot-specific trade parameters
 * Takes bot configuration into account for signal trading
 */
export async function calculateBotTradeParams(
    bot: any, // Bot from database
    action: string,
    currentPrice: number,
    symbolFilters: any
): Promise<{ quantity?: string; quoteOrderQty?: string }> {
    // Implement bot-specific calculation logic
    // This depends on bot.tradeAmountType (PERCENTAGE, FIXED_USDT, etc.)

    const quantity = "0.001"; // Placeholder
    return { quantity };
}
