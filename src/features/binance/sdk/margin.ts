/**
 * Binance Margin Trading SDK
 * 
 * Reusable functions for margin trading operations.
 * Includes borrow/repay and margin-specific order placement.
 */

import { MarginTrading } from "@binance/margin-trading";
import {
    BinanceResult,
    handleBinanceError,
    successResult,
    logRequest,
    logResponse,
} from "./client";
import { BinanceOrderResponse } from "./spot";

// ============================================================================
// TYPES
// ============================================================================

export interface MarginOrderParams {
    symbol: string;
    side: "BUY" | "SELL";
    type: "MARKET" | "LIMIT";
    quantity?: string;
    quoteOrderQty?: string;
    price?: string;
    timeInForce?: "GTC" | "IOC" | "FOK";
    sideEffectType?: "NO_SIDE_EFFECT" | "MARGIN_BUY" | "AUTO_REPAY" | "AUTO_BORROW_REPAY";
}

export interface MarginAccountInfo {
    totalAssetOfBtc: string;
    totalLiabilityOfBtc: string;
    totalNetAssetOfBtc: string;
    marginLevel: string;
    tradeEnabled: boolean;
    transferEnabled: boolean;
    borrowEnabled: boolean;
    userAssets: Array<{
        asset: string;
        free: string;
        locked: string;
        borrowed: string;
        interest: string;
        netAsset: string;
    }>;
}

export interface MarginOCOOrderParams {
    symbol: string;
    side: "BUY" | "SELL";
    quantity: string;
    price: string;              // Limit order price (take profit)
    stopPrice: string;          // Stop loss trigger price
    stopLimitPrice: string;     // Stop loss limit price
    listClientOrderId?: string;
    limitClientOrderId?: string;
    stopClientOrderId?: string;
    sideEffectType?: "NO_SIDE_EFFECT" | "AUTO_REPAY";
}

export interface MarginStopLossOrderParams {
    symbol: string;
    side: "BUY" | "SELL";
    quantity: string;
    stopPrice: string;          // Trigger price
    price?: string;             // Limit price (optional, for STOP_LOSS_LIMIT)
    sideEffectType?: "NO_SIDE_EFFECT" | "AUTO_REPAY";
}

export interface MarginTakeProfitOrderParams {
    symbol: string;
    side: "BUY" | "SELL";
    quantity: string;
    stopPrice: string;          // Trigger price  
    price?: string;             // Limit price (optional)
    sideEffectType?: "NO_SIDE_EFFECT" | "AUTO_REPAY";
}

export interface BinanceOCOOrderResponse {
    orderListId: number;
    contingencyType: string;
    listStatusType: string;
    listOrderStatus: string;
    listClientOrderId: string;
    transactionTime: number;
    symbol: string;
    orders: Array<{
        symbol: string;
        orderId: number;
        clientOrderId: string;
    }>;
    orderReports: Array<{
        symbol: string;
        orderId: number;
        orderListId: number;
        clientOrderId: string;
        transactTime: number;
        price: string;
        origQty: string;
        executedQty: string;
        cummulativeQuoteQty: string;
        status: string;
        timeInForce: string;
        type: string;
        side: string;
        stopPrice?: string;
    }>;
}


// ============================================================================
// ORDER PLACEMENT
// ============================================================================

/**
 * Place a margin market order
 */
export async function placeMarginMarketOrder(
    client: MarginTrading,
    params: {
        symbol: string;
        side: "BUY" | "SELL";
        quantity?: string;
        quoteOrderQty?: string;
        sideEffectType?: "NO_SIDE_EFFECT" | "MARGIN_BUY" | "AUTO_REPAY" | "AUTO_BORROW_REPAY";
    }
): Promise<BinanceResult<BinanceOrderResponse>> {
    try {
        logRequest("placeMarginMarketOrder", params);

        // Validate parameters
        if (!params.quantity && !params.quoteOrderQty) {
            return {
                success: false,
                error: "Either quantity or quoteOrderQty is required",
            };
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const orderParams: any = {
            symbol: params.symbol,
            side: params.side,
            type: "MARKET",
        };

        if (params.quantity) {
            orderParams.quantity = parseFloat(params.quantity);
        }

        if (params.quoteOrderQty) {
            orderParams.quoteOrderQty = parseFloat(params.quoteOrderQty);
        }

        if (params.sideEffectType) {
            orderParams.sideEffectType = params.sideEffectType;
        }

        // Place order
        const response = await client.restAPI.marginAccountNewOrder(orderParams);
        const data = await response.data();

        logResponse("placeMarginMarketOrder", data);

        return successResult(data as BinanceOrderResponse);
    } catch (error) {
        console.error("Error placing margin market order:", error);
        return handleBinanceError(error);
    }
}

/**
 * Place a margin limit order
 */
export async function placeMarginLimitOrder(
    client: MarginTrading,
    params: {
        symbol: string;
        side: "BUY" | "SELL";
        quantity: string;
        price: string;
        timeInForce?: "GTC" | "IOC" | "FOK";
        sideEffectType?: "NO_SIDE_EFFECT" | "MARGIN_BUY" | "AUTO_REPAY" | "AUTO_BORROW_REPAY";
    }
): Promise<BinanceResult<BinanceOrderResponse>> {
    try {
        logRequest("placeMarginLimitOrder", params);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const orderParams: any = {
            symbol: params.symbol,
            side: params.side,
            type: "LIMIT",
            quantity: parseFloat(params.quantity),
            price: parseFloat(params.price),
            timeInForce: params.timeInForce || "GTC",
        };

        if (params.sideEffectType) {
            orderParams.sideEffectType = params.sideEffectType;
        }

        // Place order
        const response = await client.restAPI.marginAccountNewOrder(orderParams);
        const data = await response.data();

        logResponse("placeMarginLimitOrder", data);

        return successResult(data as BinanceOrderResponse);
    } catch (error) {
        return handleBinanceError(error);
    }
}
// ... (previous code)

/**
 * Close a margin position (opposite order)
 */
export async function closeMarginPosition(
    client: MarginTrading,
    params: {
        symbol: string;
        side: "LONG" | "SHORT";
        quantity: string;
        sideEffectType?: "NO_SIDE_EFFECT" | "AUTO_REPAY";
    }
): Promise<BinanceResult<BinanceOrderResponse>> {
    try {
        logRequest("closeMarginPosition", params);

        // Determine opposite side
        const orderSide = params.side === "LONG" ? "SELL" : "BUY";

        // Place market order to close
        return await placeMarginMarketOrder(client, {
            symbol: params.symbol,
            side: orderSide,
            quantity: params.quantity,
            sideEffectType: params.sideEffectType || "NO_SIDE_EFFECT",
        });
    } catch (error) {
        return handleBinanceError(error);
    }
}

// ============================================================================
// MARGIN ACCOUNT
// ============================================================================

/**
 * Get margin account information
 */
export async function getMarginAccount(
    client: MarginTrading
): Promise<BinanceResult<MarginAccountInfo>> {
    try {
        logRequest("getMarginAccount", {});

        const response = await client.restAPI.queryCrossMarginAccountDetails();
        const data = await response.data();

        logResponse("getMarginAccount", data);

        return successResult({
            totalAssetOfBtc: data.totalAssetOfBtc || "0",
            totalLiabilityOfBtc: data.totalLiabilityOfBtc || "0",
            totalNetAssetOfBtc: data.totalNetAssetOfBtc || "0",
            marginLevel: data.marginLevel || "0",
            tradeEnabled: data.tradeEnabled || false,
            transferEnabled: data.transferInEnabled || false,
            borrowEnabled: data.borrowEnabled || false,
            userAssets: (data.userAssets || []).map((asset: any) => ({
                asset: asset.asset,
                free: asset.free,
                locked: asset.locked,
                borrowed: asset.borrowed,
                interest: asset.interest,
                netAsset: asset.netAsset,
            })),
        });
    } catch (error) {
        return handleBinanceError(error);
    }
}

/**
 * Get maximum borrowable amount for an asset
 */
export async function getMaxBorrowable(
    client: MarginTrading,
    asset: string
): Promise<BinanceResult<{ amount: number; asset: string }>> {
    try {
        logRequest("getMaxBorrowable", { asset });

        const response = await client.restAPI.queryMaxBorrow({
            asset,
            isolatedSymbol: undefined,
        });
        const data = await response.data();

        logResponse("getMaxBorrowable", data);

        return successResult({
            amount: parseFloat(data.amount || "0"),
            asset: asset,
        });
    } catch (error) {
        return handleBinanceError(error);
    }
}


export async function placeMarginOCO(
    client: MarginTrading,
    params: {
        symbol: string;
        side: "BUY" | "SELL";
        quantity: string;
        takeProfitPrice: string; // Target Price (Limit)
        stopLossTrigger: string; // SL Trigger (stopPrice)
        stopLossLimit: string;  // SL Execution (price)
        isIsolated?: boolean;
        sideEffectType?: "NO_SIDE_EFFECT" | "AUTO_REPAY";
    }
): Promise<BinanceResult<BinanceOCOOrderResponse>> {
    try {
        logRequest("placeMarginOCO", params);

        const orderParams: any = {
            symbol: params.symbol,
            side: params.side,
            quantity: params.quantity,
            price: params.takeProfitPrice,          // TP Price
            stopPrice: params.stopLossTrigger,      // SL Trigger
            stopLimitPrice: params.stopLossLimit,   // SL Execution
            stopLimitTimeInForce: "GTC",
            isIsolated: params.isIsolated ? "TRUE" : "FALSE",
        };

        if (params.sideEffectType) {
            orderParams.sideEffectType = params.sideEffectType;
        }

        // Use the specific OCO endpoint
        const response = await client.restAPI.marginAccountNewOco(orderParams);
        const data = await response.data();

        logResponse("placeMarginOCO", data);
        return successResult(data as BinanceOCOOrderResponse);
    } catch (error) {
        return handleBinanceError(error);
    }
}

export async function placeMarginTakeProfit(
    client: MarginTrading,
    params: {
        symbol: string;
        side: "BUY" | "SELL";
        quantity: string;
        stopPrice: string;       // Trigger Price
        executionPrice?: string; // Optional: If provided, uses LIMIT. If empty, uses MARKET.
        isIsolated?: boolean;
        sideEffectType?: "NO_SIDE_EFFECT" | "AUTO_REPAY" | "MARGIN_BUY";
    }
): Promise<BinanceResult<BinanceOrderResponse>> {
    try {
        logRequest("placeMarginTakeProfit", params);

        // Determine type based on presence of executionPrice
        const isLimit = !!params.executionPrice;

        const orderParams: any = {
            symbol: params.symbol,
            side: params.side,
            type: isLimit ? "TAKE_PROFIT_LIMIT" : "TAKE_PROFIT",
            quantity: params.quantity,
            stopPrice: params.stopPrice,
            isIsolated: params.isIsolated ? "TRUE" : "FALSE",
        };

        // Add limit-specific parameters if needed
        if (isLimit) {
            orderParams.price = params.executionPrice;
            orderParams.timeInForce = "GTC";
        }

        if (params.sideEffectType) {
            orderParams.sideEffectType = params.sideEffectType;
        }

        const response = await client.restAPI.marginAccountNewOrder(orderParams);
        const data = await response.data();

        logResponse("placeMarginTakeProfit", data);
        return successResult(data as BinanceOrderResponse);
    } catch (error) {
        return handleBinanceError(error);
    }
}

export async function placeMarginStopLoss(
    client: MarginTrading,
    params: {
        symbol: string;
        side: "BUY" | "SELL";
        quantity: string;
        stopPrice: string;       // The Trigger Price (Trigger level)
        executionPrice?: string; // Optional: If provided, uses LIMIT. If empty, uses MARKET.
        isIsolated?: boolean;
        sideEffectType?: "NO_SIDE_EFFECT" | "AUTO_REPAY" | "MARGIN_BUY";
    }
): Promise<BinanceResult<BinanceOrderResponse>> {
    try {
        logRequest("placeMarginStopLoss", params);

        // Determine type based on presence of executionPrice
        const isLimit = !!params.executionPrice;

        const orderParams: any = {
            symbol: params.symbol,
            side: params.side,
            // STOP_LOSS triggers a Market order, STOP_LOSS_LIMIT triggers a Limit order
            type: isLimit ? "STOP_LOSS_LIMIT" : "STOP_LOSS",
            quantity: params.quantity,
            stopPrice: params.stopPrice,
            isIsolated: params.isIsolated ? "TRUE" : "FALSE",
        };

        if (isLimit) {
            orderParams.price = params.executionPrice;
            orderParams.timeInForce = "GTC";
        }

        if (params.sideEffectType) {
            orderParams.sideEffectType = params.sideEffectType;
        }

        const response = await client.restAPI.marginAccountNewOrder(orderParams);
        const data = await response.data();

        logResponse("placeMarginStopLoss", data);
        return successResult(data as BinanceOrderResponse);
    } catch (error) {
        return handleBinanceError(error);
    }
}

/**
 * Get OCO order status
 */
export async function getMarginOCOOrder(
    client: MarginTrading,
    orderListId: number
): Promise<BinanceResult<BinanceOCOOrderResponse>> {
    try {
        logRequest("getMarginOCOOrder", { orderListId });

        const response = await client.restAPI.queryMarginAccountsOco({
            orderListId,
        });
        const data = await response.data();

        logResponse("getMarginOCOOrder", data);

        return successResult(data as BinanceOCOOrderResponse);
    } catch (error) {
        return handleBinanceError(error);
    }
}

/**
 * Cancel OCO order
 */
export async function cancelMarginOCOOrder(
    client: MarginTrading,
    params: {
        symbol: string;
        orderListId: number;
    }
): Promise<BinanceResult<BinanceOCOOrderResponse>> {
    try {
        logRequest("cancelMarginOCOOrder", params);

        const response = await client.restAPI.marginAccountCancelOco({
            symbol: params.symbol,
            orderListId: params.orderListId,
        });
        const data = await response.data();

        logResponse("cancelMarginOCOOrder", data);

        return successResult(data as BinanceOCOOrderResponse);
    } catch (error) {
        return handleBinanceError(error);
    }
}

// ============================================================================
// BORROW / REPAY
// ============================================================================

/**
 * Borrow asset on margin
 */
export async function borrowMargin(
    client: MarginTrading,
    params: {
        asset: string;
        amount: string;
    }
): Promise<BinanceResult<{ tranId: number | bigint }>> {
    try {
        logRequest("borrowMargin", params);

        const response = await client.restAPI.marginAccountBorrowRepay({
            asset: params.asset,
            amount: params.amount,
            isIsolated: 'FALSE',
            symbol: params.asset, // Empty string for cross-margin (allows auto-conversion)
            type: 'BORROW',
        });
        const data = await response.data();

        logResponse("borrowMargin", data);


        return successResult({
            tranId: data.tranId || 0,
        });
    } catch (error) {
        return handleBinanceError(error);
    }
}

/**
 * Repay borrowed asset
 */
export async function repayMargin(
    client: MarginTrading,
    params: {
        asset: string;
        amount: string;
    }
): Promise<BinanceResult<{ tranId: number | bigint }>> {
    try {
        logRequest("repayMargin", params);

        const response = await client.restAPI.marginAccountBorrowRepay({
            asset: params.asset,
            amount: params.amount,
            isIsolated: 'FALSE',
            symbol: params.asset, // Empty string for cross-margin (enables cross-asset repayment)
            type: 'REPAY',
        });
        const data = await response.data();

        logResponse("repayMargin", data);

        return successResult({
            tranId: data.tranId || 0,
        });
    } catch (error) {
        return handleBinanceError(error);
    }
}
