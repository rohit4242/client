/**
 * useSpotBalanceQuery Hook
 * 
 * React Query hook for fetching spot account balance.
 */

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/query-keys";
import { getSpotBalanceAction } from "../../actions/spot/get-spot-balance";

export interface UseSpotBalanceQueryOptions {
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
 * Fetch spot account balance
 * 
 * @example
 * const { data, isLoading } = useSpotBalanceQuery({ exchangeId });
 * const balances = data?.balances ?? [];
 */
export function useSpotBalanceQuery(options: UseSpotBalanceQueryOptions) {
    const { exchangeId, enabled = true, staleTime = 10_000, refetchInterval = 30_000 } = options;

    return useQuery({
        queryKey: queryKeys.binance.balance(exchangeId, "SPOT"),
        queryFn: async () => {
            const result = await getSpotBalanceAction({ exchangeId });

            if (!result.success || !result.data) {
                throw new Error(result.error || "Failed to fetch spot balance");
            }

            return result.data;
        },
        enabled: enabled && !!exchangeId,
        staleTime,
        refetchInterval,
    });
}
