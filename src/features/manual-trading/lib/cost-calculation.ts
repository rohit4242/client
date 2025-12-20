/**
 * Manual Trading Feature - Cost Calculation
 * 
 * Cost and fee calculation logic for orders
 */

import type { OrderFormData, CostBreakdown, PriceData } from "../types/manual-trading.types";
import { formatCurrency } from "./formatters";

/**
 * Default trading fee rates (can be overridden based on user's VIP level)
 */
const DEFAULT_MAKER_FEE = 0.001; // 0.1%
const DEFAULT_TAKER_FEE = 0.001; // 0.1%

/**
 * Calculate order cost breakdown
 */
export function calculateOrderCost(params: {
    orderData: OrderFormData;
    currentPrice: PriceData | null;
    baseAsset: string;
    quoteAsset: string;
    makerFee?: number;
    takerFee?: number;
}): CostBreakdown | null {
    const { orderData, currentPrice, baseAsset, quoteAsset, makerFee, takerFee } = params;

    // Determine which fee to use (market orders are always taker, limit can be maker or taker)
    const isMarketOrder = orderData.type === "MARKET";
    const feeRate = isMarketOrder ? (takerFee ?? DEFAULT_TAKER_FEE) : (makerFee ?? DEFAULT_MAKER_FEE);

    // Get price
    let price: number;
    if (orderData.type === "LIMIT" && orderData.price) {
        price = parseFloat(orderData.price);
    } else if (currentPrice?.price) {
        price = parseFloat(currentPrice.price);
    } else {
        return null; // Can't calculate without price
    }

    // Get quantity
    let quantity: number;
    if (orderData.quantity) {
        quantity = parseFloat(orderData.quantity);
    } else if (orderData.quoteOrderQty && price > 0) {
        // Calculate quantity from quote amount
        quantity = parseFloat(orderData.quoteOrderQty) / price;
    } else {
        return null; // Can't calculate without quantity
    }

    if (isNaN(quantity) || isNaN(price) || quantity <= 0 || price <= 0) {
        return null;
    }

    // Calculate costs
    const subtotal = quantity * price;
    const fee = subtotal * feeRate;

    let total: number;
    let netReceived: number;

    if (orderData.side === "BUY") {
        // For buy orders, total cost includes fee
        total = subtotal + fee;
        netReceived = quantity; // You receive the full quantity of base asset
    } else {
        // For sell orders, net received is after fee
        total = subtotal;
        netReceived = subtotal - fee;
    }

    return {
        side: orderData.side,
        quantity,
        price,
        subtotal,
        tradingFeeRate: feeRate,
        fee,
        total,
        netReceived,
        formattedSubtotal: `${formatCurrency(subtotal)} ${quoteAsset}`,
        formattedFee: `${formatCurrency(fee)} ${quoteAsset}`,
        formattedTotal: `${formatCurrency(orderData.side === "BUY" ? total : netReceived)} ${quoteAsset}`,
    };
}

/**
 * Get fee percentage display
 */
export function getFeePercentageDisplay(feeRate: number): string {
    return `${(feeRate * 100).toFixed(2)}%`;
}

/**
 * Get expected fee type based on order
 */
export function getExpectedFeeType(
    orderData: OrderFormData,
    currentPrice: PriceData | null
): {
    type: 'maker' | 'taker' | 'unknown';
    description: string;
} {
    if (orderData.type === "MARKET") {
        return {
            type: 'taker',
            description: 'Market orders are executed immediately and incur taker fees',
        };
    }

    if (orderData.type === "LIMIT" && orderData.price && currentPrice?.price) {
        const limitPrice = parseFloat(orderData.price);
        const marketPrice = parseFloat(currentPrice.price);

        const isBuy = orderData.side === "BUY";
        const isPriceAtOrBetterThanMarket = isBuy ? limitPrice >= marketPrice : limitPrice <= marketPrice;

        if (isPriceAtOrBetterThanMarket) {
            return {
                type: 'taker',
                description: 'Limit order at market price or better will execute immediately (taker fee)',
            };
        }

        return {
            type: 'maker',
            description: 'Limit order below/above market will be added to order book (maker fee)',
        };
    }

    return {
        type: 'unknown',
        description: 'Fee depends on order execution',
    };
}

/**
 * Calculate estimated profit/loss for a position
 */
export function calculateProfitLoss(params: {
    entryPrice: number;
    currentPrice: number;
    quantity: number;
    side: "BUY" | "SELL";
    feeRate?: number;
}): {
    pnl: number;
    pnlPercentage: number;
    formattedPnl: string;
} {
    const { entryPrice, currentPrice, quantity, side, feeRate = DEFAULT_TAKER_FEE } = params;

    let pnl: number;

    if (side === "BUY") {
        // Long position: profit when price goes up
        const entryValue = entryPrice * quantity;
        const currentValue = currentPrice * quantity;
        const entryFee = entryValue * feeRate;
        const exitFee = currentValue * feeRate;
        pnl = currentValue - entryValue - entryFee - exitFee;
    } else {
        // Short position: profit when price goes down
        const entryValue = entryPrice * quantity;
        const currentValue = currentPrice * quantity;
        const entryFee = entryValue * feeRate;
        const exitFee = currentValue * feeRate;
        pnl = entryValue - currentValue - entryFee - exitFee;
    }

    const pnlPercentage = (pnl / (entryPrice * quantity)) * 100;

    return {
        pnl,
        pnlPercentage,
        formattedPnl: pnl >= 0 ? `+${formatCurrency(pnl)}` : formatCurrency(pnl),
    };
}
