/**
 * useSyncExchangeMutation Hook
 * 
 * React Query mutation hook for syncing exchange balance with Binance.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/lib/query/query-keys";
import { syncExchange } from "../actions/sync-exchange";
import type { SyncExchangeInput } from "../types/exchange.types";

/**
 * Sync exchange balance with automatic cache invalidation
 * 
 * @example
 * const syncMutation = useSyncExchangeMutation();
 * 
 * const handleSync = (id: string) => {
 *   syncMutation.mutate({ id });
 * };
 */
export function useSyncExchangeMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: syncExchange,
        onMutate: async (variables) => {
            // Show loading toast
            toast.loading("Syncing exchange balance...", { id: "sync-exchange" });
        },
        onSuccess: (result, variables) => {
            // Dismiss loading toast
            toast.dismiss("sync-exchange");

            if (result.success) {
                // Invalidate exchanges
                queryClient.invalidateQueries({ queryKey: queryKeys.exchanges.list() });
                queryClient.invalidateQueries({
                    queryKey: queryKeys.exchanges.detail(variables.id)
                });

                // Invalidate portfolio (balance may have changed)
                queryClient.invalidateQueries({ queryKey: queryKeys.portfolio.all() });
                queryClient.invalidateQueries({ queryKey: queryKeys.trading.spotBalance() });
                queryClient.invalidateQueries({ queryKey: queryKeys.trading.marginBalance() });

                toast.success("Exchange balance synced successfully");
            } else {
                toast.error(result.error || "Failed to sync exchange");
            }
        },
        onError: (error: Error) => {
            // Dismiss loading toast
            toast.dismiss("sync-exchange");
            toast.error(error.message || "An unexpected error occurred");
        },
    });
}
