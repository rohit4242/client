"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
    UpdateBotInputSchema,
    UpdateBotInput,
    useUpdateBotMutation,
    BotWithExchange,
} from "@/features/signal-bot";
import { useBotMarketData } from "./use-bot-market-data";
import type { BotFormContextValue } from "../contexts/bot-form-context";

// ============================================================================
// Types
// ============================================================================

interface UseUpdateBotFormProps {
    bot: BotWithExchange;
    onSuccess: () => void;
    onOpenChange: (open: boolean) => void;
    open: boolean;
}

interface UseUpdateBotFormResult {
    contextValue: BotFormContextValue;
    onSubmit: (data: UpdateBotInput) => void;
    updateBotMutation: ReturnType<typeof useUpdateBotMutation>;
}

// ============================================================================
// Hook
// ============================================================================

export function useUpdateBotForm({
    bot,
    onSuccess,
    onOpenChange,
    open,
}: UseUpdateBotFormProps): UseUpdateBotFormResult {
    // -------------------------------------------------------------------------
    // Form Setup
    // -------------------------------------------------------------------------
    const form = useForm<UpdateBotInput>({
        resolver: zodResolver(UpdateBotInputSchema),
        defaultValues: {
            id: bot.id,
            name: bot.name,
            description: bot.description || "",
            exchangeId: bot.exchangeId,
            symbols: bot.symbols,
            orderType: bot.orderType as "Market" | "Limit",
            tradeAmount: bot.tradeAmount || 100,
            tradeAmountType: (bot.tradeAmountType || "QUOTE") as "QUOTE" | "BASE",
            leverage: bot.leverage || 1,
            accountType: (bot.accountType || "SPOT") as "SPOT" | "MARGIN",
            marginType: "CROSS" as const,
            sideEffectType: (bot.sideEffectType || "NO_SIDE_EFFECT") as
                | "NO_SIDE_EFFECT"
                | "MARGIN_BUY"
                | "AUTO_REPAY"
                | "AUTO_BORROW_REPAY",
            autoRepay: bot.autoRepay || false,
            maxBorrowPercent: bot.maxBorrowPercent || 50,
            useStopLoss: bot.useStopLoss ?? true,
            useTakeProfit: bot.useTakeProfit ?? true,
            stopLoss: bot.stopLoss || null,
            takeProfit: bot.takeProfit || null,
        },
    });

    // Reset form when bot changes
    useEffect(() => {
        if (open) {
            form.reset({
                id: bot.id,
                name: bot.name,
                description: bot.description || "",
                exchangeId: bot.exchangeId,
                symbols: bot.symbols,
                orderType: bot.orderType as "Market" | "Limit",
                tradeAmount: bot.tradeAmount || 100,
                tradeAmountType: (bot.tradeAmountType || "QUOTE") as "QUOTE" | "BASE",
                leverage: bot.leverage || 1,
                accountType: (bot.accountType || "SPOT") as "SPOT" | "MARGIN",
                marginType: "CROSS" as const,
                sideEffectType: (bot.sideEffectType || "NO_SIDE_EFFECT") as
                    | "NO_SIDE_EFFECT"
                    | "MARGIN_BUY"
                    | "AUTO_REPAY"
                    | "AUTO_BORROW_REPAY",
                autoRepay: bot.autoRepay || false,
                maxBorrowPercent: bot.maxBorrowPercent || 50,
                useStopLoss: bot.useStopLoss ?? true,
                useTakeProfit: bot.useTakeProfit ?? true,
                stopLoss: bot.stopLoss || null,
                takeProfit: bot.takeProfit || null,
            });
        }
    }, [bot, form, open]);

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
    const updateBotMutation = useUpdateBotMutation();

    // -------------------------------------------------------------------------
    // Submit Handler
    // -------------------------------------------------------------------------
    const onSubmit = (data: UpdateBotInput) => {
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
            toast.error("Validation failed: Missing formatted quantity");
            return;
        }

        // Format data with validated quantity
        const formattedData: UpdateBotInput = {
            ...data,
            id: bot.id,
            tradeAmount: validationResult.formattedQuantity,
            tradeAmountType: "BASE",
        };

        toast.loading("Updating signal bot...", { id: "update-bot-toast" });
        updateBotMutation.mutate(formattedData, {
            onSuccess: (result) => {
                if (result.success) {
                    toast.success("Signal bot updated successfully", {
                        id: "update-bot-toast",
                    });
                    onSuccess();
                    onOpenChange(false);
                } else {
                    toast.error(result.error || "Failed to update bot", {
                        id: "update-bot-toast",
                    });
                }
            },
            onError: (error) => {
                console.error("Mutation error:", error);
                toast.error("An error occurred while updating the bot", {
                    id: "update-bot-toast",
                });
            },
        });
    };

    // -------------------------------------------------------------------------
    // Build Context Value
    // -------------------------------------------------------------------------
    const contextValue: BotFormContextValue = {
        form,
        mode: "edit",
        exchanges: marketData.exchanges,
        isLoadingExchanges: marketData.isLoadingExchanges,
        selectedExchange: marketData.selectedExchange || bot.exchange,
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
        updateBotMutation,
    };
}
