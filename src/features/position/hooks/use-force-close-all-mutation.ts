/**
 * useForceCloseAllMutation Hook
 * 
 * React Query mutation hook for force closing all positions (database only).
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/lib/query/query-keys";
import { forceCloseAll } from "../actions/force-close-all";
import type { ServerActionResult } from "@/lib/validation/error-handler";
import type { ForceCloseAllResult } from "../schemas/position.schema";

/**
 * Force close all positions with automatic cache invalidation
 * 
 * WARNING: This only updates the database, no exchange trades are executed.
 * 
 * @example
 * const forceCloseMutation = useForceCloseAllMutation();
 * 
 * const handleForceClose = () => {
 *   forceCloseMutation.mutate({});
 * };
 */
export function useForceCloseAllMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: forceCloseAll,
        onMutate: async () => {
            // Show loading toast
            toast.loading("Force closing all positions...", { id: "force-close-all" });
        },
        onSuccess: (result: ServerActionResult<ForceCloseAllResult>) => {
            // Dismiss loading toast
            toast.dismiss("force-close-all");

            if (result.success && result.data) {
                const { closedCount, failedCount } = result.data;

                // Invalidate all position queries
                queryClient.invalidateQueries({ queryKey: queryKeys.positions.all() });

                // Invalidate portfolio
                queryClient.invalidateQueries({ queryKey: queryKeys.portfolio.all() });

                if (failedCount === 0) {
                    toast.success(`Successfully closed ${closedCount} positions`);
                } else {
                    toast.warning(
                        `Closed ${closedCount} positions, ${failedCount} failed`,
                        {
                            description: "Check console for details",
                        }
                    );
                }
            } else {
                toast.error("success" in result && !result.success ? (result as any).error : "Failed to force close positions");
            }
        },
        onError: (error: Error) => {
            // Dismiss loading toast
            toast.dismiss("force-close-all");
            toast.error(error.message || "An unexpected error occurred");
        },
    });
}
