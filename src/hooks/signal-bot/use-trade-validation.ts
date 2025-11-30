import { useQuery } from "@tanstack/react-query";
import axios from "axios";

interface UseTradeValidationParams {
    symbol: string;
    tradeAmount: number;
    tradeAmountType: "QUOTE" | "BASE";
    exchangeId: string;
    enabled?: boolean;
}

interface ValidationResult {
    valid: boolean;
    formattedQuantity?: number;
    formattedAmountType?: "BASE";
    constraints?: {
        minQty: number;
        maxQty: number;
        stepSize: number;
        minNotional: number;
    };
    currentPrice?: number;
    notionalValue?: number;
    errors?: string[];
    warnings?: string[];
}

export function useTradeValidation(params: UseTradeValidationParams) {
    const { symbol, tradeAmount, tradeAmountType, exchangeId, enabled = true } = params;

    return useQuery<ValidationResult>({
        queryKey: ["trade-validation", symbol, tradeAmount, tradeAmountType, exchangeId],
        queryFn: async () => {
            const response = await axios.post<ValidationResult>(
                "/api/signal-bots/validate-and-format",
                {
                    symbol,
                    tradeAmount,
                    tradeAmountType,
                    exchangeId,
                }
            );
            return response.data;
        },
        enabled: enabled && !!symbol && !!exchangeId && tradeAmount > 0,
        staleTime: 30000, // Cache for 30 seconds
        retry: 1,
    });
}
