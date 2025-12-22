/**
 * Manual Trading Feature - Types
 * 
 * TypeScript types and interfaces for manual trading
 */

import { type ExchangeClient } from "@/features/exchange";
import { AccountType } from "@/types/margin";
import type { OrderTypeType, OrderSideType, TimeInForceType } from "@/db/schema/order";

/**
 * Trading form props shared between spot and margin forms
 */
export interface ManualTradingState {
    selectedExchange: ExchangeClient | null;
    onSelectAssetsChange: (assets: string[]) => void;
    selectedAsset: string;
    userId: string;
    portfolioId?: string;
}

/**
 * Order form data
 */
export interface OrderFormData {
    symbol: string;
    side: OrderSideType;
    type: OrderTypeType;
    quantity?: string;
    quoteOrderQty?: string;
    price?: string;
    timeInForce?: TimeInForceType;
    sideEffectType?: string; // For margin trading
    stopLoss?: number;
    takeProfit?: number;
}

/**
 * Cost breakdown for order
 */
export interface CostBreakdown {
    side: OrderSideType;
    quantity: number;
    price: number;
    subtotal: number;
    tradingFeeRate: number;
    fee: number;
    total: number;
    netReceived: number;
    formattedSubtotal: string;
    formattedFee: string;
    formattedTotal: string;
}

/**
 * Validation context for order validation
 */
export interface ValidationContext {
    baseAsset: string;
    quoteAsset: string;
    constraints: TradingConstraints;
    baseBalance: AssetBalance | null;
    quoteBalance: AssetBalance | null;
    currentPrice: PriceData | null;
    sideEffectType?: string;
    maxBorrowableQuote?: number;
    maxBorrowableBase?: number;
}

/**
 * Trading constraints from symbol info
 */
export interface TradingConstraints {
    minQuantity: number;
    maxQuantity: number;
    stepSize: number;
    minNotional: number;
    tickSize: number;
    minPrice: number;
    maxPrice: number;
}

/**
 * Asset balance
 */
export interface AssetBalance {
    asset: string;
    free: string;
    locked: string;
}

/**
 * Price data
 */
export interface PriceData {
    symbol: string;
    price: string;
    timestamp: number;
}

/**
 * Margin account data
 */
export interface MarginAccountData {
    marginLevel: string;
    totalAssetOfBtc: string;
    totalLiabilityOfBtc: string;
    totalNetAssetOfBtc: string;
    borrowEnabled: boolean;
    tradeEnabled: boolean;
    transferEnabled: boolean;
    accountType?: string;
}

/**
 * Max buy calculation result
 */
export interface MaxBuyInfo {
    maxBuyQuantity: number;
    maxBuyTotal: number;
    limitingFactor: 'balance' | 'minQuantity' | 'none';
    hasEnoughForMin: boolean;
}

/**
 * Validation error
 */
export interface ValidationError {
    code: string;
    field: string;
    message: string;
}

/**
 * Validation result
 */
export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
    warnings: string[];
}
