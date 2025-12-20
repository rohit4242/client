"use client";

import { useMemo, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import {
    UpdateBotInputSchema,
    UpdateBotInput,
    useUpdateBotMutation,
    useTradeValidation,
    BotWithExchange,
} from "@/features/signal-bot";
import { Exchange } from "@/types/exchange";
import { useLivePrice } from "@/hooks/trading/use-live-price";
import { useTradingCalculations, MaxBorrowData } from "./use-trading-calculations";

interface UseUpdateBotFormProps {
    bot: BotWithExchange;
    onSuccess: () => void;
    onOpenChange: (open: boolean) => void;
    open: boolean;
}

export function useUpdateBotForm({ bot, onSuccess, onOpenChange, open }: UseUpdateBotFormProps) {
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
            sideEffectType: (bot.sideEffectType || "NO_SIDE_EFFECT") as "NO_SIDE_EFFECT" | "MARGIN_BUY" | "AUTO_REPAY" | "AUTO_BORROW_REPAY",
            autoRepay: bot.autoRepay || false,
            maxBorrowPercent: bot.maxBorrowPercent || 50,
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
                sideEffectType: (bot.sideEffectType || "NO_SIDE_EFFECT") as "NO_SIDE_EFFECT" | "MARGIN_BUY" | "AUTO_REPAY" | "AUTO_BORROW_REPAY",
                autoRepay: bot.autoRepay || false,
                maxBorrowPercent: bot.maxBorrowPercent || 50,
                stopLoss: bot.stopLoss || null,
                takeProfit: bot.takeProfit || null,
            });
        }
    }, [bot, form, open]);

    const watchedExchangeId = form.watch("exchangeId");
    const watchedAccountType = form.watch("accountType");
    const watchedTradeAmount = form.watch("tradeAmount");
    const watchedTradeAmountType = form.watch("tradeAmountType");
    const watchedLeverage = form.watch("leverage");
    const watchedMaxBorrowPercent = form.watch("maxBorrowPercent");
    const watchedSymbols = form.watch("symbols");

    // Fetch exchanges for the dropdown
    const { data: exchanges = [] } = useQuery<Exchange[]>({
        queryKey: ["exchanges"],
        queryFn: async () => {
            const response = await axios.get("/api/exchanges");
            return response.data;
        },
        enabled: open,
    });

    const activeExchanges = useMemo(() =>
        exchanges.filter(exchange => exchange.isActive),
        [exchanges]
    );

    const selectedExchange = useMemo(() =>
        activeExchanges.find(e => e.id === watchedExchangeId) || bot.exchange,
        [activeExchanges, watchedExchangeId, bot.exchange]
    );

    // Find exchange with full credentials for max borrow lookup
    const exchangeWithCredentials = useMemo(() =>
        exchanges.find(e => e.id === watchedExchangeId),
        [exchanges, watchedExchangeId]
    );

    // Fetch max borrowable amount when margin is selected
    const { data: maxBorrowData, isLoading: isLoadingMaxBorrow } = useQuery<{ data: MaxBorrowData }>({
        queryKey: ["maxBorrow", watchedExchangeId, "USDT"],
        queryFn: async () => {
            if (!exchangeWithCredentials) throw new Error("No exchange API credentials found");
            const response = await axios.post("/api/margin/max-borrow", {
                asset: "USDT",
                apiKey: exchangeWithCredentials.apiKey,
                apiSecret: exchangeWithCredentials.apiSecret,
            });
            return response.data;
        },
        enabled: open && watchedAccountType === "MARGIN" && !!exchangeWithCredentials,
        staleTime: 30000,
    });

    // Extract base and quote assets from symbol
    const extractAssets = (symbol: string) => {
        const quoteAssets = ['USDT', 'FDUSD', 'BUSD', 'USDC'];
        for (const quote of quoteAssets) {
            if (symbol.endsWith(quote)) {
                return { baseAsset: symbol.slice(0, -quote.length), quoteAsset: quote };
            }
        }
        return { baseAsset: symbol.slice(0, -4), quoteAsset: symbol.slice(-4) };
    };

    const selectedSymbol = watchedSymbols?.[0] || "BTCFDUSD";
    const { baseAsset, quoteAsset } = extractAssets(selectedSymbol);
    const { price: currentPrice } = useLivePrice(selectedSymbol);

    const { data: validationResult, isLoading: isValidating, isError: isValidationError, error: validationError } = useTradeValidation({
        symbol: selectedSymbol,
        tradeAmount: watchedTradeAmount || 0,
        tradeAmountType: watchedTradeAmountType || "QUOTE",
        exchangeId: watchedExchangeId || "",
        enabled: open && !!watchedExchangeId && (watchedTradeAmount || 0) > 0,
    });

    const tradingCalculations = useTradingCalculations({
        selectedExchange: selectedExchange as any,
        watchedAccountType: watchedAccountType || "SPOT",
        watchedTradeAmount: watchedTradeAmount || 0,
        watchedTradeAmountType: watchedTradeAmountType || "QUOTE",
        watchedLeverage: watchedLeverage || 1,
        maxBorrowData,
        watchedMaxBorrowPercent: watchedMaxBorrowPercent || 0,
        currentPrice: currentPrice || 0,
    });

    const updateBotMutation = useUpdateBotMutation();

    const onSubmit = (data: UpdateBotInput) => {
        console.log("Submit clicked. Data:", data);
        console.log("Validation State:", { isValidating, isValidationError, validationResult });

        if (isValidating) {
            toast.loading("Validating trade amount...", { id: "validation-toast" });
            return;
        }

        if (isValidationError || !validationResult) {
            const errorMsg = validationError instanceof Error ? validationError.message : "Validation failed. Please check your network or inputs.";
            console.error("Validation Error:", validationError);
            toast.error(errorMsg);
            return;
        }

        if (!validationResult.valid) {
            console.warn("Validation Result Invalid:", validationResult.errors);
            const firstError = validationResult.errors?.[0] || "Invalid trade amount";
            toast.error(firstError);
            return;
        }

        if (!validationResult.formattedQuantity) {
            console.error("Missing formattedQuantity");
            toast.error("Validation failed: Missing formatted quantity");
            return;
        }

        // Override with formatted values
        const formattedData: UpdateBotInput = {
            ...data,
            id: bot.id,
            tradeAmount: validationResult.formattedQuantity,
            tradeAmountType: "BASE", // Always BASE after formatting
        };

        console.log("Submitting formatted data:", formattedData);
        toast.loading("Updating signal bot...", { id: "update-bot-toast" });
        updateBotMutation.mutate(formattedData, {
            onSuccess: (result) => {
                if (result.success) {
                    toast.success("Signal bot updated successfully", { id: "update-bot-toast" });
                    onSuccess();
                    onOpenChange(false);
                } else {
                    toast.error(result.error || "Failed to update bot", { id: "update-bot-toast" });
                }
            },
            onError: (error) => {
                console.error("Mutation error:", error);
                toast.error("An error occurred while updating the bot", { id: "update-bot-toast" });
            }
        });
    };

    const accountTypeChanged = watchedAccountType !== (bot.accountType || "SPOT");

    return {
        form,
        activeExchanges,
        selectedExchange,
        selectedSymbol,
        baseAsset,
        quoteAsset,
        currentPrice,
        tradingCalculations: tradingCalculations ? { ...tradingCalculations, accountTypeChanged } : null,
        validationResult,
        isValidating,
        isValidationError,
        validationError,
        isLoadingMaxBorrow,
        updateBotMutation,
        onSubmit,
        watchedTradeAmount: watchedTradeAmount || 0,
        watchedTradeAmountType: watchedTradeAmountType || "QUOTE",
        watchedAccountType: watchedAccountType || "SPOT",
    };
}
