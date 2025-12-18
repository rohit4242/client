/**
 * useClosePositionMutation Hook
 * 
 * React Query mutation hook for closing a position.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/lib/query/query-keys";
import { closePosition } from "../actions/close-position";
import type { ServerActionResult } from "@/lib/validation/error-handler";
import type { ClosePositionResult } from "../schemas/position.schema";

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
        mutationFn: closePosition,
        onSuccess: (result: ServerActionResult<ClosePositionResult>, variables) => {
            if (result.success) {
                // Invalidate positions queries
                queryClient.invalidateQueries({ queryKey: queryKeys.positions.all() });

                // Invalidate specific position
                queryClient.invalidateQueries({
                    queryKey: queryKeys.positions.detail(variables.positionId)
                });

                // Invalidate portfolio (balance may have changed)
                queryClient.invalidateQueries({ queryKey: queryKeys.portfolio.all() });

                toast.success("Position closed successfully");
            } else {
                toast.error(result.error || "Failed to close position");
            }
        },
        onError: (error: Error) => {
            toast.error(error.message || "An unexpected error occurred");
        },
    });
}
