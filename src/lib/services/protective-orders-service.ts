/**
 * Protective Orders Service
 * Handles placing Stop Loss and Take Profit orders on Binance
 * 
 * This service places conditional orders on the exchange AFTER the entry order fills.
 * These orders will automatically trigger when the price hits SL/TP levels.
 */

import { MarginTrading } from "@binance/margin-trading";
import { Position } from "@prisma/client";
import { BinanceConfig, ConditionalOrderParams, ExchangeResult, BinanceOrderResponse } from "./exchange/types";

export interface ProtectiveOrdersResult {
    stopLossOrderId?: string;
    takeProfitOrderId?: string;
    stopLossError?: string;
    takeProfitError?: string;
}

export interface ProtectiveOrderContext {
    config: BinanceConfig;
    symbol: string;
    side: "LONG" | "SHORT";
    quantity: number;
    stopLossPrice?: number | null;
    takeProfitPrice?: number | null;
    accountType: "SPOT" | "MARGIN";
}

/**
 * Place a conditional order (STOP_LOSS or TAKE_PROFIT) on Binance Margin
 */
async function placeMarginConditionalOrder(
    config: BinanceConfig,
    params: ConditionalOrderParams
): Promise<ExchangeResult> {
    try {
        console.log("[Protective Orders] Placing conditional order:", params);

        const client = new MarginTrading({ configurationRestAPI: config });

        // Build order parameters for Binance
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const orderParams: any = {
            symbol: params.symbol,
            side: params.side,
            type: params.type,
            quantity: parseFloat(params.quantity),
            stopPrice: parseFloat(params.stopPrice),
        };

        // For LIMIT variants, add price and timeInForce
        if (params.type === 'STOP_LOSS_LIMIT' || params.type === 'TAKE_PROFIT_LIMIT') {
            if (params.price) {
                orderParams.price = parseFloat(params.price);
            }
            orderParams.timeInForce = params.timeInForce || 'GTC';
        }

        // Add side effect type for margin orders
        if (params.sideEffectType) {
            orderParams.sideEffectType = params.sideEffectType;
        }

        console.log("[Protective Orders] Order params:", orderParams);

        const response = await client.restAPI.marginAccountNewOrder(orderParams);
        const data = await response.data();

        console.log("[Protective Orders] Order placed successfully:", data);

        return {
            success: true,
            data: data as BinanceOrderResponse,
        };
    } catch (error: unknown) {
        console.error("[Protective Orders] Error placing order:", error);

        // Handle Binance API errors
        if (
            error &&
            typeof error === "object" &&
            "response" in error &&
            error.response &&
            typeof error.response === "object" &&
            "data" in error.response
        ) {
            const binanceError = (
                error.response as { data: { msg?: string; code?: number } }
            ).data;
            return {
                success: false,
                error: binanceError.msg || "Unknown Binance error",
                code: binanceError.code,
            };
        }

        const errorMessage =
            error instanceof Error ? error.message : "Unknown error occurred";
        return {
            success: false,
            error: errorMessage,
        };
    }
}

/**
 * Place a Stop Loss order on Binance
 */
export async function placeStopLossOrder(
    context: ProtectiveOrderContext
): Promise<{ orderId?: string; error?: string }> {
    if (!context.stopLossPrice) {
        return { error: "No stop loss price provided" };
    }

    // Determine the order side (opposite of position side)
    const orderSide = context.side === "LONG" ? "SELL" : "BUY";

    const params: ConditionalOrderParams = {
        symbol: context.symbol,
        side: orderSide,
        type: "STOP_LOSS",  // Using market variant (triggers at stopPrice, executes as market)
        quantity: context.quantity.toString(),
        stopPrice: context.stopLossPrice.toString(),
        sideEffectType: context.accountType === "MARGIN" ? "AUTO_REPAY" : undefined,
    };

    const result = await placeMarginConditionalOrder(context.config, params);

    if (result.success && result.data) {
        return { orderId: result.data.orderId.toString() };
    }

    return { error: result.error };
}

/**
 * Place a Take Profit order on Binance
 */
export async function placeTakeProfitOrder(
    context: ProtectiveOrderContext
): Promise<{ orderId?: string; error?: string }> {
    if (!context.takeProfitPrice) {
        return { error: "No take profit price provided" };
    }

    // Determine the order side (opposite of position side)
    const orderSide = context.side === "LONG" ? "SELL" : "BUY";

    const params: ConditionalOrderParams = {
        symbol: context.symbol,
        side: orderSide,
        type: "TAKE_PROFIT",  // Using market variant (triggers at stopPrice, executes as market)
        quantity: context.quantity.toString(),
        stopPrice: context.takeProfitPrice.toString(),
        sideEffectType: context.accountType === "MARGIN" ? "AUTO_REPAY" : undefined,
    };

    const result = await placeMarginConditionalOrder(context.config, params);

    if (result.success && result.data) {
        return { orderId: result.data.orderId.toString() };
    }

    return { error: result.error };
}

/**
 * Place both Stop Loss and Take Profit orders on Binance
 * This is called after entry order fills to protect the position
 */
export async function placeProtectiveOrders(
    context: ProtectiveOrderContext
): Promise<ProtectiveOrdersResult> {
    const result: ProtectiveOrdersResult = {};

    console.log("[Protective Orders] Placing protective orders for", {
        symbol: context.symbol,
        side: context.side,
        quantity: context.quantity,
        stopLoss: context.stopLossPrice,
        takeProfit: context.takeProfitPrice,
    });

    // Place Stop Loss order
    if (context.stopLossPrice) {
        const slResult = await placeStopLossOrder(context);
        if (slResult.orderId) {
            result.stopLossOrderId = slResult.orderId;
            console.log("[Protective Orders] Stop Loss order placed:", slResult.orderId);
        } else {
            result.stopLossError = slResult.error;
            console.error("[Protective Orders] Stop Loss order failed:", slResult.error);
        }
    }

    // Place Take Profit order
    if (context.takeProfitPrice) {
        const tpResult = await placeTakeProfitOrder(context);
        if (tpResult.orderId) {
            result.takeProfitOrderId = tpResult.orderId;
            console.log("[Protective Orders] Take Profit order placed:", tpResult.orderId);
        } else {
            result.takeProfitError = tpResult.error;
            console.error("[Protective Orders] Take Profit order failed:", tpResult.error);
        }
    }

    return result;
}

/**
 * Cancel a single order on Binance
 */
export async function cancelMarginOrder(
    config: BinanceConfig,
    symbol: string,
    orderId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        console.log("[Protective Orders] Cancelling order:", { symbol, orderId });

        const client = new MarginTrading({ configurationRestAPI: config });

        const response = await client.restAPI.marginAccountCancelOrder({
            symbol,
            orderId: parseInt(orderId, 10),
        });

        const data = await response.data();
        console.log("[Protective Orders] Order cancelled:", data);

        return { success: true };
    } catch (error: unknown) {
        console.error("[Protective Orders] Error cancelling order:", error);

        // Handle Binance API errors
        if (
            error &&
            typeof error === "object" &&
            "response" in error &&
            error.response &&
            typeof error.response === "object" &&
            "data" in error.response
        ) {
            const binanceError = (
                error.response as { data: { msg?: string; code?: number } }
            ).data;

            // Order might already be filled or cancelled - that's OK
            if (binanceError.code === -2011) { // Unknown order
                return { success: true }; // Order doesn't exist, consider it cancelled
            }

            return {
                success: false,
                error: binanceError.msg || "Unknown Binance error",
            };
        }

        const errorMessage =
            error instanceof Error ? error.message : "Unknown error occurred";
        return { success: false, error: errorMessage };
    }
}

/**
 * Cancel both SL and TP orders for a position
 * Call this before manually closing a position
 */
export async function cancelProtectiveOrders(
    config: BinanceConfig,
    position: {
        symbol: string;
        stopLossOrderId?: string | null;
        takeProfitOrderId?: string | null;
    }
): Promise<{ slCancelled: boolean; tpCancelled: boolean; errors?: string[] }> {
    const errors: string[] = [];
    let slCancelled = true;
    let tpCancelled = true;

    console.log("[Protective Orders] Cancelling protective orders for position:", position);

    // Cancel Stop Loss order if exists
    if (position.stopLossOrderId) {
        const slResult = await cancelMarginOrder(config, position.symbol, position.stopLossOrderId);
        slCancelled = slResult.success;
        if (!slResult.success && slResult.error) {
            errors.push(`SL cancel failed: ${slResult.error}`);
        }
    }

    // Cancel Take Profit order if exists
    if (position.takeProfitOrderId) {
        const tpResult = await cancelMarginOrder(config, position.symbol, position.takeProfitOrderId);
        tpCancelled = tpResult.success;
        if (!tpResult.success && tpResult.error) {
            errors.push(`TP cancel failed: ${tpResult.error}`);
        }
    }

    return {
        slCancelled,
        tpCancelled,
        errors: errors.length > 0 ? errors : undefined,
    };
}

/**
 * Query order status on Binance
 */
export async function getOrderStatus(
    config: BinanceConfig,
    symbol: string,
    orderId: string
): Promise<{ status?: string; error?: string }> {
    try {
        const client = new MarginTrading({ configurationRestAPI: config });

        const response = await client.restAPI.queryMarginAccountsOrder({
            symbol,
            orderId: parseInt(orderId, 10),
        });

        const data = await response.data();
        return { status: data.status };
    } catch (error: unknown) {
        console.error("[Protective Orders] Error querying order:", error);

        if (
            error &&
            typeof error === "object" &&
            "response" in error &&
            error.response &&
            typeof error.response === "object" &&
            "data" in error.response
        ) {
            const binanceError = (
                error.response as { data: { msg?: string; code?: number } }
            ).data;
            return { error: binanceError.msg };
        }

        const errorMessage =
            error instanceof Error ? error.message : "Unknown error occurred";
        return { error: errorMessage };
    }
}
