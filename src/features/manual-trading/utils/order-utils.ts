/**
 * Manual Trading Feature - Order Utilities
 * 
 * Utilities for working with orders
 */

import type { OrderTypeType, OrderSideType } from "@/db/schema/order";

/**
 * Check if order type is market
 */
export function isMarketOrder(type: OrderTypeType): boolean {
    return type === "MARKET";
}

/**
 * Check if order type is limit
 */
export function isLimitOrder(type: OrderTypeType): boolean {
    return type === "LIMIT";
}

/**
 * Get order type display name
 */
export function getOrderTypeDisplay(type: OrderTypeType): string {
    return type.charAt(0) + type.slice(1).toLowerCase();
}

/**
 * Get order side display name
 */
export function getOrderSideDisplay(side: OrderSideType): string {
    return side.charAt(0) + side.slice(1).toLowerCase();
}

/**
 * Check if order is a buy order
 */
export function isBuyOrder(side: OrderSideType): boolean {
    return side === "BUY";
}

/**
 * Check if order is a sell order
 */
export function isSellOrder(side: OrderSideType): boolean {
    return side === "SELL";
}
