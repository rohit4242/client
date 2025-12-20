/**
 * Manual Trading Feature - Exports
 * 
 * Central export point for the manual trading feature
 */

// ===== Types ===== 
export type {
    TradingFormProps,
    OrderFormData,
    CostBreakdown,
    ValidationContext,
    TradingConstraints,
    AssetBalance,
    PriceData,
    MarginAccountData,
    MaxBuyInfo,
    ValidationError,
    ValidationResult,
} from "./types/manual-trading.types";

// ===== Schemas =====
export {
    SpotOrderSchema,
    PlaceSpotOrderSchema,
    type SpotOrderInput,
    type PlaceSpotOrderInput,
} from "./schemas/spot-order.schema";

export {
    MarginOrderSchema,
    PlaceMarginOrderSchema,
    type MarginOrderInput,
    type PlaceMarginOrderInput,
} from "./schemas/margin-order.schema";

// ===== Server Actions =====
export { placeSpotOrderAction } from "./actions/place-spot-order";
export { placeMarginOrderAction } from "./actions/place-margin-order";

// ===== Utilities =====
export {
    extractBaseAsset,
    extractQuoteAsset,
    formatAssetAmount,
    parseAssetAmount,
} from "./utils/asset-utils";

export {
    isMarketOrder,
    isLimitOrder,
    getOrderTypeDisplay,
    getOrderSideDisplay,
    isBuyOrder,
    isSellOrder,
} from "./utils/order-utils";

// ===== Library Functions =====
export {
    formatCurrency,
    formatNumber,
    formatPercentage,
    formatPrice,
    formatQuantity,
    abbreviateNumber,
} from "./lib/formatters";

export {
    calculateOrderCost,
    getFeePercentageDisplay,
    getExpectedFeeType,
    calculateProfitLoss,
} from "./lib/cost-calculation";

export {
    validateOrder,
} from "./lib/validation-rules";

// ===== Hooks =====
export { useCostCalculator } from "./hooks/use-cost-calculator";
export { useOrderValidation } from "./hooks/use-order-validation";
export { useTradingForm } from "./hooks/use-trading-form";

// ===== Components =====
export { ManualTradingView } from "./components/manual-trading-view";

// Re-export existing components for backward compatibility
// (These still reference the old locations until full migration)
export { ExchangeSelector } from "@/components/trading/exchange-selector";
export { AccountTypeToggle } from "@/components/trading/account-type-toggle";
export { TradingChart } from "@/components/trading/trading-chart";
export { SpotTradingForm } from "@/components/trading/forms/spot-trading-form";
export { MarginTradingForm } from "@/components/trading/forms/margin-trading-form";
export { MarginAccountCard } from "@/components/margin/margin-account-card";
export { BorrowRepayModal } from "@/components/margin/borrow-repay-modal";
export { TransferModal } from "@/components/margin/transfer-modal";
