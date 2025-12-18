/**
 * Binance SDK Exports
 * 
 * Central export point for all Binance SDK functionality.
 */

// Client
export {
    createSpotClient,
    createMarginClient,
    handleBinanceError,
    successResult,
    errorResult,
    validateConfig,
    validateSymbol,
    type BinanceConfig,
    type BinanceResult,
} from "./client";

// Spot Trading
export {
    placeSpotMarketOrder,
    placeSpotLimitOrder,
    closeSpotPosition,
    getSpotBalance,
    getAssetBalance,
    getOrderStatus,
    cancelOrder,
    type SpotOrderParams,
    type BinanceOrderResponse,
} from "./spot";

// Margin Trading
export {
    placeMarginMarketOrder,
    placeMarginLimitOrder,
    closeMarginPosition,
    getMarginAccount,
    getMaxBorrowable,
    borrowMargin,
    repayMargin,
    type MarginOrderParams,
    type MarginAccountInfo,
} from "./margin";

// Market Data
export {
    getSymbolPrice,
    getTicker24h,
    getSymbolInfo,
    getExchangeInfo,
    getPriceFilter,
    getLotSizeFilter,
    getMinNotionalFilter,
    formatPrice,
    formatQuantity,
    validateMinNotional,
    type SymbolPrice,
    type Ticker24h,
    type SymbolInfo,
    type SymbolFilter,
} from "./market";

// WebSocket
export {
    createPriceStream,
    createSimplePriceStream,
    type PriceTickerEvent,
    type WebSocketMessage,
    type WebSocketConfig,
    type WebSocketConnection,
} from "./websocket";
