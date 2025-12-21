"use client";

import { useMemo } from "react";
import { Exchange } from "@/types/exchange";
import { calculateExitPrices, calculateRiskReward } from "../utils/bot-calculations";
import { PartialExchange } from "../contexts/bot-form-context";

export interface MaxBorrowData {
    asset: string;
    maxBorrowable: string;
    currentBorrowed: string;
    interest: string;
    totalOwed: string;
}

interface UseTradingCalculationsParams {
    selectedExchange: Exchange | PartialExchange | undefined;
    watchedAccountType: string;
    watchedTradeAmount: number;
    watchedTradeAmountType: "QUOTE" | "BASE";
    watchedLeverage: number;
    watchedMaxBorrowPercent: number;
    currentPrice: number | null;
    maxBorrowData: { data: MaxBorrowData } | undefined;
    stopLoss?: number | null;
    takeProfit?: number | null;
}

export function useTradingCalculations({
    selectedExchange,
    watchedAccountType,
    watchedTradeAmount,
    watchedTradeAmountType,
    watchedLeverage,
    watchedMaxBorrowPercent,
    currentPrice,
    maxBorrowData,
    stopLoss,
    takeProfit,
}: UseTradingCalculationsParams) {
    return useMemo(() => {
        if (!selectedExchange) return null;

        const spotValue = selectedExchange.spotValue || 0;
        const marginValue = selectedExchange.marginValue || 0;
        const activeValue = watchedAccountType === "SPOT" ? spotValue : marginValue;
        const tradeAmount = watchedTradeAmount || 0;
        const leverage = watchedLeverage || 1;
        const isQuoteType = watchedTradeAmountType === "QUOTE";
        const price = currentPrice || 0;

        // Calculate USDT equivalent (always needed for balance check)
        const usdtValue = isQuoteType
            ? tradeAmount
            : tradeAmount * price;

        // Calculate BASE equivalent (for display)
        const baseValue = isQuoteType
            ? (price > 0 ? tradeAmount / price : 0)
            : tradeAmount;

        // Position value is always in USDT for calculations
        const positionValue = usdtValue;
        const leveragedValue = positionValue * leverage;
        const borrowAmount = leveragedValue - positionValue;

        // Rename for clarity
        const exchangeMaxBorrowable = maxBorrowData?.data?.maxBorrowable
            ? parseFloat(maxBorrowData.data.maxBorrowable)
            : 0;

        // Calculate user limit based on percentage
        const userMaxBorrowable = exchangeMaxBorrowable * ((watchedMaxBorrowPercent || 0) / 100);

        // For Spot: Must have full position value
        // For Margin: Can use balance + borrow to cover position
        const hasSufficientBalance = activeValue >= usdtValue;
        const totalBuyingPower = watchedAccountType === "MARGIN"
            ? activeValue + userMaxBorrowable
            : activeValue;
        const hasSufficientWithBorrow = watchedAccountType === "MARGIN"
            ? totalBuyingPower >= leveragedValue
            : hasSufficientBalance;

        // Calculate exit prices if TP/SL are provided
        const exitPrices = price > 0 ? calculateExitPrices(
            "Long",
            price,
            stopLoss ?? null,
            takeProfit ?? null
        ) : { stopLossPrice: null, takeProfitPrice: null };

        // Calculate risk/reward metrics
        const riskReward = price > 0 ? calculateRiskReward(
            price,
            exitPrices.stopLossPrice,
            exitPrices.takeProfitPrice,
            baseValue
        ) : null;

        return {
            spotValue,
            marginValue,
            activeValue,
            positionValue,
            leveragedValue,
            borrowAmount,
            exchangeMaxBorrowable,
            userMaxBorrowable,
            totalBuyingPower,
            currentBorrowed: maxBorrowData?.data?.currentBorrowed
                ? parseFloat(maxBorrowData.data.currentBorrowed)
                : 0,
            exceedsMaxBorrow: borrowAmount > userMaxBorrowable && watchedAccountType === "MARGIN" && leverage > 1,
            hasSufficientBalance,
            hasSufficientWithBorrow,
            // Conversion display
            usdtValue,
            baseValue,
            currentPrice: price,
            hasPrice: price > 0,
            // Exit prices
            exitPrices,
            riskReward,
        };
    }, [
        selectedExchange,
        watchedAccountType,
        watchedTradeAmount,
        watchedTradeAmountType,
        watchedLeverage,
        maxBorrowData,
        currentPrice,
        watchedMaxBorrowPercent,
        stopLoss,
        takeProfit
    ]);
}
