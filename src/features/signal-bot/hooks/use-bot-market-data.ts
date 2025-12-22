"use client";

import { useMemo } from "react";
import { UseFormReturn } from "react-hook-form";
import { useDebounce } from "@/hooks/use-debounce";
import { useLivePrice } from "@/hooks/trading/use-live-price";
import { useExchangesQuery } from "@/features/exchange/hooks/use-exchanges-query";
import { useMaxBorrowableQuery } from "@/features/binance/hooks/queries/use-max-borrowable-query";
import { useTradeValidation } from "./use-trade-validation";
import { CreateBotInput, UpdateBotInput } from "../types/bot.types";
import {
    extractAssets,
    calculateLeveragedPosition,
    calculateBuyingPower,
    calculateUserMaxBorrow,
    calculateExitPrices,
    calculateRiskReward,
    convertTradeAmount,
    checkSufficientFunds,
} from "../utils/trading.utils";
import type {
    TradingCalculations,
    MaxBorrowData,
    TradeValidationResult,
    PartialExchange,
} from "../contexts/bot-form-context";
import { type ExchangeClient } from "@/features/exchange";

// ============================================================================
// Types
// ============================================================================

interface UseBotMarketDataParams {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    form: UseFormReturn<any>;
    enabled: boolean;
}

interface UseBotMarketDataResult {
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
    // Borrow data
    maxBorrowData: MaxBorrowData | undefined;
    isLoadingBorrowData: boolean;
    borrowError: string | null;
    refetchBorrowData: () => void;
    // Validation
    validationResult: TradeValidationResult | undefined;
    isValidating: boolean;
    // Calculations
    calculations: TradingCalculations | null;
    // Watched values
    watchedAccountType: "SPOT" | "MARGIN";
    watchedTradeAmount: number;
    watchedTradeAmountType: "QUOTE" | "BASE";
}

// ============================================================================
// Hook
// ============================================================================

export function useBotMarketData({
    form,
    enabled,
}: UseBotMarketDataParams): UseBotMarketDataResult {
    // -------------------------------------------------------------------------
    // Watch Form Values
    // -------------------------------------------------------------------------
    const watchedExchangeId = form.watch("exchangeId");
    const watchedSymbols = form.watch("symbols");
    const watchedAccountType = (form.watch("accountType") || "SPOT") as
        | "SPOT"
        | "MARGIN";
    const watchedTradeAmount = form.watch("tradeAmount") || 0;
    const watchedTradeAmountType = (form.watch("tradeAmountType") || "QUOTE") as
        | "QUOTE"
        | "BASE";
    const watchedLeverage = form.watch("leverage") || 1;
    const watchedMaxBorrowPercent = form.watch("maxBorrowPercent") || 50;
    const watchedStopLoss = form.watch("stopLoss");
    const watchedTakeProfit = form.watch("takeProfit");

    // Derived symbol values
    const selectedSymbol = watchedSymbols?.[0] || "BTCUSDT";
    const { base: baseAsset, quote: quoteAsset } = extractAssets(selectedSymbol);

    // -------------------------------------------------------------------------
    // Queries
    // -------------------------------------------------------------------------

    // 1. Exchanges (always enabled when dialog is open)
    const { data: exchangesData, isLoading: isLoadingExchanges } =
        useExchangesQuery({
            enabled,
        });
    const exchanges = exchangesData?.exchanges ?? [];
    const activeExchanges = useMemo(
        () => exchanges.filter((e) => e.isActive),
        [exchanges]
    );

    // 2. Selected Exchange
    const selectedExchange = useMemo(
        () => activeExchanges.find((e) => e.id === watchedExchangeId),
        [activeExchanges, watchedExchangeId]
    );

    // 3. Live Price (enabled when symbol is selected)
    const { price: currentPrice, isUpdating: isLoadingPrice } = useLivePrice(
        selectedSymbol
    );

    // 4. Max Borrowable (enabled when MARGIN + exchange selected)
    const {
        data: quoteMaxBorrow,
        isFetching: isLoadingBorrowData,
        error: borrowQueryError,
        refetch: refetchBorrowData,
    } = useMaxBorrowableQuery({
        exchangeId: watchedExchangeId || "",
        asset: quoteAsset,
        enabled:
            enabled && watchedAccountType === "MARGIN" && !!watchedExchangeId,
        staleTime: 30000,
    });

    // Extract error message
    const borrowError = borrowQueryError
        ? borrowQueryError instanceof Error
            ? borrowQueryError.message
            : "Failed to fetch borrowing limits"
        : null;

    // Adapt max borrow data to our type
    const maxBorrowData: MaxBorrowData | undefined = useMemo(() => {
        if (!quoteMaxBorrow) return undefined;
        return {
            asset: quoteMaxBorrow.asset,
            amount: quoteMaxBorrow.amount,
            currentBorrowed: 0,
        };
    }, [quoteMaxBorrow]);

    // 5. Trade Validation (debounced)
    const debouncedAmount = useDebounce(watchedTradeAmount, 300);
    const {
        data: validationResult,
        isLoading: isValidating,
    } = useTradeValidation({
        symbol: selectedSymbol,
        tradeAmount: debouncedAmount || 0,
        tradeAmountType: watchedTradeAmountType,
        exchangeId: watchedExchangeId || "",
        enabled: enabled && !!watchedExchangeId && debouncedAmount > 0,
    });

    // -------------------------------------------------------------------------
    // Calculations (Memoized)
    // -------------------------------------------------------------------------
    const calculations: TradingCalculations | null = useMemo(() => {
        if (!selectedExchange) return null;

        const price = currentPrice || 0;
        const spotValue = selectedExchange.spotValue || 0;
        const marginValue = selectedExchange.marginValue || 0;
        const activeValue =
            watchedAccountType === "SPOT" ? spotValue : marginValue;

        // Convert trade amount
        const { usdtValue, baseValue } = convertTradeAmount(
            watchedTradeAmount,
            watchedTradeAmountType,
            price
        );

        // Calculate leveraged position
        const { positionValue, leveragedValue, borrowAmount } =
            calculateLeveragedPosition(usdtValue, watchedLeverage);

        // Calculate max borrow
        const exchangeMaxBorrowable = maxBorrowData?.amount || 0;
        const userMaxBorrowable = calculateUserMaxBorrow(
            exchangeMaxBorrowable,
            watchedMaxBorrowPercent
        );

        // Calculate buying power
        const buyingPower = calculateBuyingPower(
            activeValue,
            userMaxBorrowable,
            watchedAccountType
        );

        // Check funds
        const { hasSufficient: hasSufficientWithBorrow } = checkSufficientFunds(
            leveragedValue,
            activeValue,
            userMaxBorrowable,
            watchedAccountType
        );
        const hasSufficientBalance = activeValue >= usdtValue;
        const exceedsMaxBorrow =
            borrowAmount > userMaxBorrowable &&
            watchedAccountType === "MARGIN" &&
            watchedLeverage > 1;

        // Calculate exit prices
        const exitPrices = calculateExitPrices(
            "Long",
            price,
            watchedStopLoss ?? null,
            watchedTakeProfit ?? null
        );

        // Calculate risk/reward
        const riskReward =
            price > 0
                ? calculateRiskReward(
                    price,
                    exitPrices.stopLossPrice,
                    exitPrices.takeProfitPrice,
                    baseValue
                )
                : null;

        return {
            positionValue,
            leveragedValue,
            borrowAmount,
            activeValue,
            totalBuyingPower: buyingPower.total,
            userMaxBorrowable,
            exchangeMaxBorrowable,
            usdtValue,
            baseValue,
            currentPrice: price,
            hasPrice: price > 0,
            hasSufficientBalance,
            hasSufficientWithBorrow,
            exceedsMaxBorrow,
            exitPrices,
            riskReward,
        };
    }, [
        selectedExchange,
        currentPrice,
        watchedAccountType,
        watchedTradeAmount,
        watchedTradeAmountType,
        watchedLeverage,
        watchedMaxBorrowPercent,
        maxBorrowData,
        watchedStopLoss,
        watchedTakeProfit,
    ]);

    // -------------------------------------------------------------------------
    // Return
    // -------------------------------------------------------------------------
    return {
        // Exchange data
        exchanges: activeExchanges,
        isLoadingExchanges,
        selectedExchange,
        // Symbol data
        selectedSymbol,
        baseAsset,
        quoteAsset,
        // Price data
        currentPrice,
        isLoadingPrice,
        // Borrow data
        maxBorrowData,
        isLoadingBorrowData,
        borrowError,
        refetchBorrowData,
        // Validation
        validationResult: validationResult as TradeValidationResult | undefined,
        isValidating,
        // Calculations
        calculations,
        // Watched values
        watchedAccountType,
        watchedTradeAmount,
        watchedTradeAmountType,
    };
}
