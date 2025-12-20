/**
 * Trading Engine - Binance Execution
 * 
 * Executes trades on Binance using the new production SDK
 */

import type { NormalizedTradingRequest, TradeParams } from "../types/trading.types";
import type { BinanceResult, BinanceOrderResponse, BinanceOCOOrderResponse } from "@/features/binance";
import {
    createSpotClient,
    createMarginClient,
    placeSpotMarketOrder,
    placeSpotLimitOrder,
    placeMarginMarketOrder,
    placeMarginLimitOrder,
    placeMarginTakeProfit,
    placeMarginStopLoss,
    placeMarginOCO,
} from "@/features/binance";

/**
 * Execute trade on Binance
 * Routes to appropriate SDK function based on account type and order type
 */
export async function executeBinanceTrade(
    request: NormalizedTradingRequest,
    params: TradeParams
): Promise<BinanceResult<BinanceOrderResponse | BinanceOCOOrderResponse>> {
    if (request.order.accountType === "SPOT") {
        return executeSpotTrade(request, params);
    } else {
        return executeMarginTrade(request, params);
    }
}

/**
 * Execute spot trade
 */
async function executeSpotTrade(
    request: NormalizedTradingRequest,
    params: TradeParams
): Promise<BinanceResult<BinanceOrderResponse>> {
    const client = createSpotClient({
        apiKey: request.exchange.apiKey,
        apiSecret: request.exchange.apiSecret,
    });

    if (request.order.type === "MARKET") {
        return placeSpotMarketOrder(client, {
            symbol: request.order.symbol,
            side: request.order.side,
            quantity: params.quantity,
            quoteOrderQty: params.quoteOrderQty,
        });
    } else {
        // LIMIT order
        if (!params.quantity || !params.price) {
            return {
                success: false,
                error: "Quantity and price required for limit orders",
            };
        }

        return placeSpotLimitOrder(client, {
            symbol: request.order.symbol,
            side: request.order.side,
            quantity: params.quantity,
            price: params.price,
            timeInForce: request.order.timeInForce || "GTC",
        });
    }
}

/**
 * Execute margin trade
 */
async function executeMarginTrade(
    request: NormalizedTradingRequest,
    params: TradeParams
): Promise<BinanceResult<BinanceOrderResponse | BinanceOCOOrderResponse>> {
    const client = createMarginClient({
        apiKey: request.exchange.apiKey,
        apiSecret: request.exchange.apiSecret,
    });
    const quantity = params.quantity || request.order.quantity;
    if (!quantity) {
        return {
            success: false,
            error: "Quantity required for margin orders",
        };
    }

    if (request.order.takeProfit && request.order.stopLoss) {
        return placeMarginOCO(client, {
            symbol: request.order.symbol,
            side: request.order.side,
            quantity: quantity,
            takeProfitPrice: request.order.takeProfit.toString(),
            stopLossTrigger: request.order.stopLoss.toString(),
            stopLossLimit: request.order.stopLoss.toString(),
        });
    }

    if (request.order.takeProfit) {
        return placeMarginTakeProfit(client, {
            symbol: request.order.symbol,
            side: request.order.side,
            quantity: quantity,
            stopPrice: request.order.takeProfit.toString(),
            executionPrice: request.order.price,
            sideEffectType: request.order.sideEffectType,
        });
    }

    if (request.order.stopLoss) {
        return placeMarginStopLoss(client, {
            symbol: request.order.symbol,
            side: request.order.side,
            quantity: quantity,

            executionPrice: request.order.price,
            stopPrice: request.order.stopLoss.toString(),
            sideEffectType: request.order.sideEffectType,
        });
    }

    if (request.order.type === "MARKET") {
        return placeMarginMarketOrder(client, {
            symbol: request.order.symbol,
            side: request.order.side,
            quantity: params.quantity,
            quoteOrderQty: params.quoteOrderQty,
            sideEffectType: request.order.sideEffectType,
        });
    } else {
        // LIMIT order
        if (!params.quantity || !params.price) {
            return {
                success: false,
                error: "Quantity and price required for limit orders",
            };
        }

        return placeMarginLimitOrder(client, {
            symbol: request.order.symbol,
            side: request.order.side,
            quantity: params.quantity,
            price: params.price,
            timeInForce: request.order.timeInForce || "GTC",
            sideEffectType: request.order.sideEffectType,
        });
    }
}
