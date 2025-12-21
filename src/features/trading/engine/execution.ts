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
 * Two-step process: 1) Entry order, 2) Protective orders (OCO/TP/SL)
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

    // STEP 1: Place entry order (opens the position)
    console.log('[Trading Engine] Step 1: Placing entry order', {
        type: request.order.type,
        side: request.order.side,
        quantity
    });

    let entryResult: BinanceResult<BinanceOrderResponse>;

    if (request.order.type === "MARKET") {
        entryResult = await placeMarginMarketOrder(client, {
            symbol: request.order.symbol,
            side: request.order.side,
            quantity: params.quantity,
            quoteOrderQty: params.quoteOrderQty,
            sideEffectType: request.order.sideEffectType || "AUTO_BORROW_REPAY",
        });
    } else {
        // LIMIT order
        if (!params.quantity || !params.price) {
            return {
                success: false,
                error: "Quantity and price required for limit orders",
            };
        }

        entryResult = await placeMarginLimitOrder(client, {
            symbol: request.order.symbol,
            side: request.order.side,
            quantity: params.quantity,
            price: params.price,
            timeInForce: request.order.timeInForce || "GTC",
            sideEffectType: request.order.sideEffectType || "AUTO_BORROW_REPAY",
        });
    }

    // If entry order failed, return immediately
    if (!entryResult.success) {
        console.error('[Trading Engine] Entry order failed:', entryResult.error);
        return entryResult;
    }

    console.log('[Trading Engine] Entry order placed successfully:', {
        orderId: entryResult.data?.orderId,
        status: entryResult.data?.status
    });

    // STEP 2: Place protective orders (if TP/SL specified)
    // These orders EXIT the position, so they use the OPPOSITE side
    const hasProtectiveOrders = params.takeProfitPrice || params.stopLossPrice;

    if (!hasProtectiveOrders) {
        // No TP/SL, return entry order result
        return entryResult;
    }

    // Determine exit side (opposite of entry)
    const exitSide = request.order.side === 'BUY' ? 'SELL' : 'BUY';

    console.log('[Trading Engine] Step 2: Placing protective orders', {
        entrySide: request.order.side,
        exitSide,
        hasTP: !!params.takeProfitPrice,
        hasSL: !!params.stopLossPrice
    });

    // Both TP and SL → Use OCO
    if (params.takeProfitPrice && params.stopLossPrice) {
        const isLong = request.order.side === 'BUY';

        // For OCO exit orders:
        // - SELL OCO (closing LONG): price (LIMIT) should be TP (above entry), stopPrice should be SL (below entry)
        // - BUY OCO (closing SHORT): price (LIMIT) should be TP (below entry), stopPrice should be SL (above entry)
        const limitPrice = params.takeProfitPrice;  // TP is always the LIMIT order
        const stopPrice = params.stopLossPrice;     // SL is always the STOP order
        const stopLimitPrice = isLong
            ? stopPrice * 0.999   // SELL: slightly lower than SL trigger (selling on the way down)
            : stopPrice * 1.001;  // BUY: slightly higher than SL trigger (buying on the way up)

        console.log('[OCO Mapping]', {
            entrySide: request.order.side,
            exitSide,
            calculated: { TP: params.takeProfitPrice, SL: params.stopLossPrice },
            binance: {
                limitPrice,      // LIMIT_MAKER (TP)
                stopPrice,       // STOP trigger (SL)
                stopLimitPrice: stopLimitPrice.toFixed(2)
            }
        });

        const ocoResult = await placeMarginOCO(client, {
            symbol: request.order.symbol,
            side: exitSide,  // OPPOSITE side to exit position
            quantity: quantity,
            takeProfitPrice: limitPrice.toString(),
            stopLossTrigger: stopPrice.toString(),
            stopLossLimit: stopLimitPrice.toFixed(2),
            sideEffectType: "AUTO_REPAY",  // Repay borrowed funds on exit
        });

        if (!ocoResult.success) {
            console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.error('⚠️  CRITICAL WARNING: UNPROTECTED POSITION');
            console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.error('[Trading Engine] Entry order FILLED but protective OCO FAILED');
            console.error('[Trading Engine] Position details:', {
                orderId: entryResult.data?.orderId,
                symbol: request.order.symbol,
                side: request.order.side,
                quantity,
                entryPrice: params.expectedPrice
            });
            console.error('[Trading Engine] OCO failure reason:', ocoResult.error);
            console.error('[Trading Engine] Expected TP/SL:', {
                takeProfit: params.takeProfitPrice,
                stopLoss: params.stopLossPrice
            });
            console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.error('⚠️  ACTION REQUIRED: Position has NO stop loss protection!');
            console.error('⚠️  Please manually set protective orders on Binance');
            console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

            // Return entry result with critical warning
            return {
                success: true,  // Entry succeeded
                data: entryResult.data,
                warning: `CRITICAL: Position opened successfully but protective orders FAILED to place. ${ocoResult.error}. Position is UNPROTECTED - please set SL/TP manually on Binance!`,
                protectiveOrderError: ocoResult.error,
                isUnprotected: true
            } as any;
        }

        console.log('[Trading Engine] Protective OCO placed successfully:', {
            orderListId: ocoResult.data?.orderListId
        });

        // Return OCO result (contains both entry info + protective orders)
        return ocoResult;
    }

    // Only TP → Use take profit order
    if (params.takeProfitPrice) {
        const tpResult = await placeMarginTakeProfit(client, {
            symbol: request.order.symbol,
            side: exitSide,  // OPPOSITE side to exit position
            quantity: quantity,
            stopPrice: params.takeProfitPrice.toString(),
            executionPrice: params.price,
            sideEffectType: "AUTO_REPAY",
        });

        if (!tpResult.success) {
            console.error('[Trading Engine] WARNING: Entry filled but TP order failed:', tpResult.error);
            console.warn('[Trading Engine] Position is partially protected (no take profit)');
            return {
                success: true,
                data: entryResult.data,
                warning: `Position opened but Take Profit order failed: ${tpResult.error}`,
                protectiveOrderError: tpResult.error
            } as any;
        }

        console.log('[Trading Engine] Protective TP placed successfully:', tpResult.data?.orderId);
        return tpResult;
    }

    // Only SL → Use stop loss order
    if (params.stopLossPrice) {
        const slResult = await placeMarginStopLoss(client, {
            symbol: request.order.symbol,
            side: exitSide,  // OPPOSITE side to exit position
            quantity: quantity,
            executionPrice: params.price,
            stopPrice: params.stopLossPrice.toString(),
            sideEffectType: "AUTO_REPAY",
        });

        if (!slResult.success) {
            console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.error('⚠️  CRITICAL WARNING: UNPROTECTED POSITION');
            console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.error('[Trading Engine] Entry filled but SL order FAILED:', slResult.error);
            console.error('[Trading Engine] Position has NO STOP LOSS - High risk!');
            console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

            return {
                success: true,
                data: entryResult.data,
                warning: `CRITICAL: Position opened but Stop Loss FAILED: ${slResult.error}. Position is UNPROTECTED!`,
                protectiveOrderError: slResult.error,
                isUnprotected: true
            } as any;
        }

        console.log('[Trading Engine] Protective SL placed successfully:', slResult.data?.orderId);
        return slResult;
    }

    // Fallback (shouldn't reach here)
    return entryResult;
}
