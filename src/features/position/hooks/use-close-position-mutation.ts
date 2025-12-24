/**
 * useClosePositionMutation Hook
 * 
 * React Query mutation hook for closing a position.
 * Uses the functional closePositionAction from trading feature.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/lib/query/query-keys";
import { closePositionAction } from "@/features/trading/actions/close-position";
import type { ServerActionResult } from "@/lib/validation/error-handler";
import type { TradingResult } from "@/features/trading/types/trading.types";

interface ClosePositionInput {
    positionId: string;
    sideEffectType?: "NO_SIDE_EFFECT" | "AUTO_REPAY";
}

/**
 * Close position with automatic cache invalidation
 * 
 * @example
 * const closeMutation = useClosePositionMutation();
 * 
 * const handleClose = (positionId: string) => {
 *   closeMutation.mutate({ positionId });
 * };
 */
export function useClosePositionMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: ClosePositionInput) => {
            const result = await closePositionAction(input);

            if (!result.success) {
                throw new Error(result.error || "Failed to close position");
            }

            return result.data!;
        },
        onSuccess: (data: TradingResult, variables) => {
            // Invalidate positions queries
            queryClient.invalidateQueries({ queryKey: queryKeys.positions.all() });

            // Invalidate specific position
            queryClient.invalidateQueries({
                queryKey: queryKeys.positions.detail(variables.positionId)
            });

            // Invalidate orders (order status changed)
            queryClient.invalidateQueries({ queryKey: queryKeys.orders.all() });

            // Invalidate portfolio (balance may have changed)
            queryClient.invalidateQueries({ queryKey: queryKeys.portfolio.all() });

            // Invalidate binance balance
            queryClient.invalidateQueries({ queryKey: ["binance", "balance"] });

            toast.success("Position closed successfully");
        },
        onError: (error: Error) => {
            toast.error(error.message || "An unexpected error occurred");
        },
    });
}
