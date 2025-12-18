/**
 * useTradeValidation hook
 * 
 * Validates a potential trade against exchange constraints.
 */

import { useQuery } from "@tanstack/react-query";
import { validateTrade } from "../actions/validate-trade";
import type { ValidateTradeResult } from "../schemas/bot.schema";

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
                throw new Error(result.error || "Trade validation failed");
            }

            return result.data!; // This action returns data property for result
        },
        enabled: enabled && !!symbol && !!exchangeId && tradeAmount > 0,
        staleTime: 30000, // Cache for 30 seconds
        retry: 1,
    });
}
