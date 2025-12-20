/**
 * useMarginBalanceQuery Hook
 * 
 * React Query hook for fetching margin account balance.
 */

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/query-keys";
import { getMarginBalanceAction } from "../../actions/margin/get-margin-balance";

export interface UseMarginBalanceQueryOptions {
    /**
     * Exchange ID
     */
    exchangeId: string;
    /**
     * Enable/disable the query
     * @default true
     */
    enabled?: boolean;
    /**
     * Time in milliseconds before data is considered stale
     * @default 10000 (10 seconds)
     */
    staleTime?: number;
    /**
     * Interval for automatic refetching (in milliseconds)
     * @default 30000 (30 seconds)
     */
    refetchInterval?: number | false;
}

/**
 * Fetch margin account balance
 * 
 * @example
 * const { data, isLoading } = useMarginBalanceQuery({ exchangeId });
 * const marginLevel = parseFloat(data?.marginLevel ?? "0");
 */
export function useMarginBalanceQuery(options: UseMarginBalanceQueryOptions) {
    const { exchangeId, enabled = true, staleTime = 10_000, refetchInterval = 30_000 } = options;

    return useQuery({
        queryKey: queryKeys.binance.balance(exchangeId, "MARGIN"),
        queryFn: async () => {
            const result = await getMarginBalanceAction({ exchangeId });

            if (!result.success || !result.data) {
                throw new Error("Failed to fetch margin balance");
            }

            return result.data;
        },
        enabled: enabled && !!exchangeId,
        staleTime,
        refetchInterval,
    });
}
