import type { TradingResult } from "../types/trading.types";
import type { PlaceOrderInput } from "../schemas/order.schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { placeOrderAction } from "../actions/place-order";
import { queryKeys } from "@/lib/query/query-keys";

export interface UsePlaceOrderMutationOptions {
    onSuccess?: (data: TradingResult) => void;
    onError?: (error: Error) => void;
}

/**
 * Hook for placing orders (manual trading)
 */
export function usePlaceOrderMutation(options?: UsePlaceOrderMutationOptions) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: PlaceOrderInput) => {
            const result = await placeOrderAction(input);

            if (!result.success) {
                throw new Error(result.error || "Failed to place order");
            }

            return result.data!;
        },
        onSuccess: (data) => {
            // Invalidate relevant queries
            queryClient.invalidateQueries({ queryKey: queryKeys.positions._def });
            queryClient.invalidateQueries({ queryKey: queryKeys.orders._def });
            queryClient.invalidateQueries({ queryKey: queryKeys.portfolio._def });
            queryClient.invalidateQueries({ queryKey: queryKeys.binance.balance._def });

            toast.success("Order placed successfully!");

            options?.onSuccess?.(data);
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to place order");
            options?.onError?.(error);
        },
    });
}
