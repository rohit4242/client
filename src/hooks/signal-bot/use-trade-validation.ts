import { useQuery } from "@tanstack/react-query";
import { validateTrade, type ValidateTradeResult } from "@/features/signal-bot";

interface UseTradeValidationParams {
    symbol: string;
    tradeAmount: number;
    tradeAmountType: "QUOTE" | "BASE";
    exchangeId: string;
    enabled?: boolean;
}

export function useTradeValidation(params: UseTradeValidationParams) {
    const { symbol, tradeAmount, tradeAmountType, exchangeId, enabled = true } = params;

    return useQuery<ValidateTradeResult>({
        queryKey: ["trade-validation", symbol, tradeAmount, tradeAmountType, exchangeId],
        queryFn: async () => {
            const result = await validateTrade({
                symbol,
                tradeAmount,
                tradeAmountType,
                exchangeId,
            });

            if (!result.success) {
                throw new Error(result.error);
            }

            return result.data!;
        },
        enabled: enabled && !!symbol && !!exchangeId && tradeAmount > 0,
        staleTime: 30000, // Cache for 30 seconds
        retry: 1,
    });
}
