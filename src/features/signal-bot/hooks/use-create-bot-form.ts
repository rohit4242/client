"use client";

import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
    CreateBotInputSchema,
    CreateBotInput,
    useCreateBotMutation,
    useTradeValidation,
    BotWithExchange,
} from "@/features/signal-bot";
import { Exchange } from "@/types/exchange";
import { useLivePrice } from "@/hooks/trading/use-live-price";
import { useTradingCalculations, MaxBorrowData } from "./use-trading-calculations";
import { useMaxBorrowableQuery } from "@/features/binance/hooks/queries/use-max-borrowable-query";
import { useExchangesQuery } from "@/features/exchange/hooks/use-exchanges-query";

interface UseCreateBotFormProps {
    onSuccess: (result: BotWithExchange) => void;
    onOpenChange: (open: boolean) => void;
    open: boolean;
}

export function useCreateBotForm({ onSuccess, onOpenChange, open }: UseCreateBotFormProps) {
    const form = useForm<CreateBotInput>({
        resolver: zodResolver(CreateBotInputSchema),
        defaultValues: {
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
        },
    });

    const watchedExchangeId = form.watch("exchangeId");
    const watchedAccountType = form.watch("accountType");
    const watchedTradeAmount = form.watch("tradeAmount");
    const watchedTradeAmountType = form.watch("tradeAmountType");
    const watchedLeverage = form.watch("leverage");
    const watchedSymbols = form.watch("symbols");
    const watchedMaxBorrowPercent = form.watch("maxBorrowPercent");

    const { data: exchangesData } = useExchangesQuery({ enabled: open });
    const exchanges = exchangesData?.exchanges ?? [];

    const activeExchanges = useMemo(() =>
        exchanges.filter(exchange => exchange.isActive),
        [exchanges]
    );

    const selectedExchange = useMemo(() =>
        activeExchanges.find(e => e.id === watchedExchangeId),
        [activeExchanges, watchedExchangeId]
    );

    const selectedSymbol = watchedSymbols?.[0] || "BTCFDUSD";

    // Extract base and quote assets from symbol
    const extractAssets = (symbol: string) => {
        const quoteAssets = ['USDT', 'FDUSD', 'BUSD', 'USDC'];
        for (const quote of quoteAssets) {
            if (symbol.endsWith(quote)) {
                return { baseAsset: symbol.slice(0, -quote.length), quoteAsset: quote };
            }
        }
        return { baseAsset: symbol.slice(0, -5), quoteAsset: symbol.slice(-5) };
    };

    const { baseAsset, quoteAsset } = extractAssets(selectedSymbol);

    const { data: maxBorrowData, isLoading: isLoadingMaxBorrow } = useMaxBorrowableQuery({
        exchangeId: watchedExchangeId || "",
        asset: quoteAsset,
        enabled: open && watchedAccountType === "MARGIN" && !!watchedExchangeId,
        staleTime: 30000,
    });

    // Adapt maxBorrowData to the format expected by useTradingCalculations
    const adaptedMaxBorrowData = useMemo(() => {
        if (!maxBorrowData) return undefined;
        return {
            data: {
                asset: maxBorrowData.asset,
                maxBorrowable: maxBorrowData.amount.toString(),
                currentBorrowed: "0",
                interest: "0",
                totalOwed: "0",
            } as MaxBorrowData
        };
    }, [maxBorrowData]);

    const { price: currentPrice } = useLivePrice(selectedSymbol);

    const { data: validationResult, isLoading: isValidating, isError: isValidationError, error: validationError } = useTradeValidation({
        symbol: selectedSymbol,
        tradeAmount: watchedTradeAmount || 0,
        tradeAmountType: watchedTradeAmountType || "QUOTE",
        exchangeId: watchedExchangeId,
        enabled: open && !!watchedExchangeId && (watchedTradeAmount || 0) > 0,
    });

    const tradingCalculations = useTradingCalculations({
        selectedExchange,
        watchedAccountType,
        watchedTradeAmount,
        watchedTradeAmountType,
        watchedLeverage,
        watchedMaxBorrowPercent,
        currentPrice,
        maxBorrowData: adaptedMaxBorrowData,
    });

    const createBotMutation = useCreateBotMutation();

    const onSubmit = (data: CreateBotInput) => {
        if (isValidating) {
            toast.loading("Validating trade amount...", { id: "validation-toast" });
            return;
        }

        if (isValidationError || !validationResult) {
            const errorMsg = validationError instanceof Error ? validationError.message : "Validation failed. Please check your network or inputs.";
            toast.error(errorMsg);
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
            }
        });
    };

    return {
        form,
        activeExchanges,
        selectedExchange,
        tradingCalculations,
        validationResult,
        isValidating,
        isValidationError,
        validationError,
        isLoadingMaxBorrow,
        createBotMutation,
        onSubmit,
        currentPrice,
        selectedSymbol,
        baseAsset,
        quoteAsset,
    };
}
