/**
 * useSyncPortfolioBalanceMutation Hook
 * 
 * React Query mutation hook for syncing portfolio balance.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/lib/query/query-keys";
import { syncPortfolioBalance } from "../actions/sync-portfolio-balance";
import type { SyncPortfolioBalanceInput } from "../types/portfolio.types";

/**
 * Sync portfolio balance from active exchange
 * 
 * @example
 * const syncMutation = useSyncPortfolioBalanceMutation();
 * 
 * const handleSync = () => {
 *   syncMutation.mutate();
 * };
 */
export function useSyncPortfolioBalanceMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (input?: SyncPortfolioBalanceInput) => syncPortfolioBalance(input),
        onMutate: () => {
            toast.loading("Syncing portfolio balance...", { id: "sync-portfolio" });
        },
        onSuccess: (result) => {
            toast.dismiss("sync-portfolio");

            if (result.success) {
                // Invalidate portfolio queries
                queryClient.invalidateQueries({ queryKey: queryKeys.portfolio.all() });

                // Invalidate exchanges (balance came from exchange)
                queryClient.invalidateQueries({ queryKey: queryKeys.exchanges.all() });

                if (result.data.synced) {
                    toast.success(
                        `Portfolio balance synced: $${result.data.currentBalance.toFixed(2)}`
                    );
                } else {
                    toast.info("Portfolio balance is already set");
                }
            } else {
                toast.error(result.error || "Failed to sync portfolio balance");
            }
        },
        onError: (error: Error) => {
            toast.dismiss("sync-portfolio");
            toast.error(error.message || "An unexpected error occurred");
        },
    });
}
