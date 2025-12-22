/**
 * useCloseAllPositionsMutation Hook
 * 
 * React Query mutation hook for closing all open positions via exchange
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/lib/query/query-keys";
import { closeAllPositionsAction } from "../actions/close-all-positions";
import type { ServerActionResult } from "@/lib/validation/error-handler";
import type { CloseAllPositionsResult } from "../actions/close-all-positions";

/**
 * Close all positions with automatic cache invalidation and progress feedback
 * 
 * @example
 * const closeAllMutation = useCloseAllPositionsMutation();
 * 
 * const handleCloseAll = () => {
 *   closeAllMutation.mutate();
 * };
 */
export function useCloseAllPositionsMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: closeAllPositionsAction,
        onMutate: async () => {
            // Show loading toast
            toast.loading("Closing all positions...", { id: "close-all" });
        },
        onSuccess: (result: ServerActionResult<CloseAllPositionsResult>) => {
            // Dismiss loading toast
            toast.dismiss("close-all");

            if (result.success && result.data) {
                const { totalCount, successCount, failedCount } = result.data;

                // Invalidate all position queries
                queryClient.invalidateQueries({ queryKey: queryKeys.positions.all() });

                // Invalidate portfolio
                queryClient.invalidateQueries({ queryKey: queryKeys.portfolio.all() });

                // Invalidate orders
                queryClient.invalidateQueries({ queryKey: queryKeys.orders.all() });

                // Show appropriate success/warning message
                if (failedCount === 0) {
                    toast.success(`Successfully closed all ${successCount} positions`, {
                        description: "All positions have been closed on the exchange",
                    });
                } else if (successCount > 0) {
                    toast.warning(
                        `Closed ${successCount} of ${totalCount} positions`,
                        {
                            description: `${failedCount} positions failed to close. Check the positions table for details.`,
                        }
                    );
                } else {
                    toast.error(
                        `Failed to close all ${totalCount} positions`,
                        {
                            description: "Please try closing positions individually or check exchange connection",
                        }
                    );
                }

                // Log detailed results for debugging
                console.log("[Close All] Results:", result.data.results);

                // Show individual errors for failed positions
                if (failedCount > 0 && failedCount <= 3) {
                    result.data.results
                        .filter(r => !r.success)
                        .forEach(r => {
                            toast.error(`Failed to close ${r.symbol}`, {
                                description: r.error,
                            });
                        });
                }
            } else {
                toast.error("success" in result && !result.success ? (result as any).error : "Failed to close positions");
            }
        },
        onError: (error: Error) => {
            // Dismiss loading toast
            toast.dismiss("close-all");
            toast.error("Failed to close all positions", {
                description: error.message || "An unexpected error occurred",
            });
        },
    });
}
