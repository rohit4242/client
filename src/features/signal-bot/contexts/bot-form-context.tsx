"use client";

import React, { createContext, useContext, useMemo } from "react";
import { UseFormReturn, FieldValues } from "react-hook-form";
import { type ExchangeClient } from "@/features/exchange";

// ============================================================================
// Types
// ============================================================================

// Use a generic form type to avoid union type conflicts
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type BotFormType = UseFormReturn<any>;


export interface MaxBorrowData {
    asset: string;
    amount: number;
    currentBorrowed: number;
}

export interface TradeValidationResult {
    valid: boolean;
    formattedQuantity: number | null;
    notionalValue: number | null;
    currentPrice: number | null;
    errors: string[];
    constraints?: {
        minQty: string;
        maxQty: string;
        stepSize: string;
        minNotional: string;
    };
}

export interface TradingCalculations {
    // Position values
    positionValue: number;
    leveragedValue: number;
    borrowAmount: number;
    // Buying power
    activeValue: number;
    totalBuyingPower: number;
    userMaxBorrowable: number;
    exchangeMaxBorrowable: number;
    // Amount conversions
    usdtValue: number;
    baseValue: number;
    currentPrice: number;
    hasPrice: boolean;
    // Validation flags
    hasSufficientBalance: boolean;
    hasSufficientWithBorrow: boolean;
    exceedsMaxBorrow: boolean;
    // Exit prices
    exitPrices: {
        stopLossPrice: number | null;
        takeProfitPrice: number | null;
    };
    // Risk/reward
    riskReward: {
        riskAmount: number;
        rewardAmount: number;
        ratio: number | null;
        riskPercent: number;
        rewardPercent: number;
    } | null;
}

export interface PartialExchange {
    id: string;
    name: string;
    spotValue?: number | null;
    marginValue?: number | null;
    totalValue?: number | null;
}

export interface BotFormContextValue {
    // Form
    form: BotFormType;
    mode: "create" | "edit";
    // Exchange data
    exchanges: ExchangeClient[];
    isLoadingExchanges: boolean;
    selectedExchange: ExchangeClient | PartialExchange | undefined;
    // Symbol data
    selectedSymbol: string;
    baseAsset: string;
    quoteAsset: string;
    // Price data
    currentPrice: number | null;
    isLoadingPrice: boolean;
    // Borrow data (MARGIN only)
    maxBorrowData: MaxBorrowData | undefined;
    isLoadingBorrowData: boolean;
    borrowError: string | null;
    refetchBorrowData: () => void;
    // Trade validation
    validationResult: TradeValidationResult | undefined;
    isValidating: boolean;
    // Calculations
    calculations: TradingCalculations | null;
    isRecalculating: boolean;
    // Form values (commonly accessed)
    watchedAccountType: "SPOT" | "MARGIN";
    watchedTradeAmount: number;
    watchedTradeAmountType: "QUOTE" | "BASE";
}

// ============================================================================
// Context
// ============================================================================

const BotFormContext = createContext<BotFormContextValue | null>(null);

/**
 * Hook to access the bot form context.
 * Must be used within a BotFormProvider.
 */
export function useBotFormContext(): BotFormContextValue {
    const context = useContext(BotFormContext);
    if (!context) {
        throw new Error("useBotFormContext must be used within a BotFormProvider");
    }
    return context;
}

// ============================================================================
// Provider Props
// ============================================================================

interface BotFormProviderProps {
    children: React.ReactNode;
    value: BotFormContextValue;
}

/**
 * Provider component for the bot form context.
 * Wraps the form and provides all market data to child components.
 */
export function BotFormProvider({ children, value }: BotFormProviderProps) {
    // Memoize the context value to prevent unnecessary re-renders
    const memoizedValue = useMemo(() => value, [value]);

    return (
        <BotFormContext.Provider value={memoizedValue}>
            {children}
        </BotFormContext.Provider>
    );
}
