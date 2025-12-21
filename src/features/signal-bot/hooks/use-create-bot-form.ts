"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
    CreateBotInputSchema,
    CreateBotInput,
    useCreateBotMutation,
    BotWithExchange,
} from "@/features/signal-bot";
import { useBotMarketData } from "./use-bot-market-data";
import type { BotFormContextValue } from "../contexts/bot-form-context";

// ============================================================================
// Types
// ============================================================================

interface UseCreateBotFormProps {
    onSuccess: (result: BotWithExchange) => void;
    onOpenChange: (open: boolean) => void;
    open: boolean;
}

interface UseCreateBotFormResult {
    contextValue: BotFormContextValue;
    onSubmit: (data: CreateBotInput) => void;
    createBotMutation: ReturnType<typeof useCreateBotMutation>;
}

// ============================================================================
// Default Values
// ============================================================================

const DEFAULT_VALUES: CreateBotInput = {
    name: "",
    description: "",
    exchangeId: "",
    symbols: ["BTCUSDT"],
    orderType: "Market" as const,
    tradeAmount: 100,
    tradeAmountType: "QUOTE" as const,
    leverage: 1,
    accountType: "SPOT" as const,
    marginType: "CROSS" as const,
    sideEffectType: "NO_SIDE_EFFECT" as const,
    autoRepay: false,
    maxBorrowPercent: 50,
    stopLoss: null,
    takeProfit: null,
};

// ============================================================================
// Hook
// ============================================================================

export function useCreateBotForm({
    onSuccess,
    onOpenChange,
    open,
}: UseCreateBotFormProps): UseCreateBotFormResult {
    // -------------------------------------------------------------------------
    // Form Setup
    // -------------------------------------------------------------------------
    const form = useForm<CreateBotInput>({
        resolver: zodResolver(CreateBotInputSchema),
        defaultValues: DEFAULT_VALUES,
    });

    // -------------------------------------------------------------------------
    // Market Data (centralized)
    // -------------------------------------------------------------------------
    const marketData = useBotMarketData({
        form,
        enabled: open,
    });

    // -------------------------------------------------------------------------
    // Mutation
    // -------------------------------------------------------------------------
    const createBotMutation = useCreateBotMutation();

    // -------------------------------------------------------------------------
    // Submit Handler
    // -------------------------------------------------------------------------
    const onSubmit = (data: CreateBotInput) => {
        const { validationResult, isValidating } = marketData;

        if (isValidating) {
            toast.loading("Validating trade amount...", { id: "validation-toast" });
            return;
        }

        if (!validationResult) {
            toast.error("Validation failed. Please check your inputs.");
            return;
        }

        if (!validationResult.valid) {
            const firstError = validationResult.errors?.[0] || "Invalid trade amount";
            toast.error(firstError);
            return;
        }

        if (!validationResult.formattedQuantity) {
            toast.error("Internal error: Formatted quantity missing");
            return;
        }

        // Format data with validated quantity
        const formattedData: CreateBotInput = {
            ...data,
            tradeAmount: validationResult.formattedQuantity,
            tradeAmountType: "BASE",
        };

        createBotMutation.mutate(formattedData, {
            onSuccess: (result) => {
                if (result.success && result.data) {
                    form.reset();
                    onSuccess(result.data);
                    onOpenChange(false);
                }
            },
        });
    };

    // -------------------------------------------------------------------------
    // Build Context Value
    // -------------------------------------------------------------------------
    const contextValue: BotFormContextValue = {
        form,
        mode: "create",
        exchanges: marketData.exchanges,
        isLoadingExchanges: marketData.isLoadingExchanges,
        selectedExchange: marketData.selectedExchange,
        selectedSymbol: marketData.selectedSymbol,
        baseAsset: marketData.baseAsset,
        quoteAsset: marketData.quoteAsset,
        currentPrice: marketData.currentPrice,
        isLoadingPrice: marketData.isLoadingPrice,
        maxBorrowData: marketData.maxBorrowData,
        isLoadingBorrowData: marketData.isLoadingBorrowData,
        borrowError: marketData.borrowError,
        refetchBorrowData: marketData.refetchBorrowData,
        validationResult: marketData.validationResult,
        isValidating: marketData.isValidating,
        calculations: marketData.calculations,
        isRecalculating:
            marketData.isLoadingExchanges ||
            marketData.isLoadingPrice ||
            marketData.isLoadingBorrowData ||
            marketData.isValidating,
        watchedAccountType: marketData.watchedAccountType,
        watchedTradeAmount: marketData.watchedTradeAmount,
        watchedTradeAmountType: marketData.watchedTradeAmountType,
    };

    return {
        contextValue,
        onSubmit,
        createBotMutation,
    };
}
