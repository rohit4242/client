/**
 * Close Position Mutation Hook
 * 
 * React Query mutation for closing positions
 * Uses the unified trading engine
 */

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { closePositionAction } from "../actions/close-position";
import type { TradingResult } from "../types/trading.types";
import { queryKeys } from "@/lib/query/query-keys";

export interface ClosePositionInput {
    positionId: string;
    sideEffectType?: "NO_SIDE_EFFECT" | "AUTO_REPAY";
}

export interface UseClosePositionMutationOptions {
    onSuccess?: (data: TradingResult) => void;
    onError?: (error: Error) => void;
}

/**
 * Hook for closing positions
 * 
 * @example
 * ```tsx
 * const { mutate: closePosition, isLoading } = useClosePositionMutation({
 *   onSuccess: () => {
 *     console.log("Position closed!");
 *   },
 * });
 * 
 * closePosition({
 *   positionId: "...",
 *   sideEffectType: "AUTO_REPAY",
 * });
 * ```
 */
export function useClosePositionMutation(options?: UseClosePositionMutationOptions) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: ClosePositionInput) => {
            const result = await closePositionAction(input);

            if (!result.success) {
                throw new Error(result.error || "Failed to close position");
            }

            return result.data!;
        },
        onSuccess: (data) => {
            // Invalidate relevant queries
            queryClient.invalidateQueries({ queryKey: queryKeys.positions._def });
            queryClient.invalidateQueries({ queryKey: queryKeys.orders._def });
            queryClient.invalidateQueries({ queryKey: queryKeys.portfolio._def });
            queryClient.invalidateQueries({ queryKey: queryKeys.binance.balance._def });

            toast.success("Position closed successfully!");

            options?.onSuccess?.(data);
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to close position");
            options?.onError?.(error);
        },
    });
}
