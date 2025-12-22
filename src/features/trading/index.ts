/**
 * Trading Feature - Exports
 * 
 * Central export point for unified trading system
 */

// Types
export type {
    TradingRequest,
    NormalizedTradingRequest,
    TradingResult,
    ValidationResult,
    ValidationData,
    TradeParams,
    SignalAction,
    TradingSource,
} from "./types/trading.types";

// Engine
export {
    executeTradingRequest,
    normalizeRequest,
    validateTradingRequest,
    calculateTradeParams,
    executeBinanceTrade,
    createPendingPosition,
    updatePositionWithExecution,
    createOrderRecord,
} from "./engine";

// Actions
export { placeOrderAction } from "./actions/place-order";
export { processSignalAction } from "./actions/process-signal";

// Schemas
export { PlaceOrderInputSchema, type PlaceOrderInput } from "./schemas/order.schema";

// Hooks
export { usePlaceOrderMutation, useClosePositionMutation, useCloseAllPositionsMutation } from "./hooks";
