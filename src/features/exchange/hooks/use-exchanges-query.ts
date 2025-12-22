/**
 * useExchangesQuery Hook
 * 
 * React Query hook for fetching all exchanges.
 */

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/query-keys";
import { getExchanges } from "../actions/get-exchanges";

export interface UseExchangesQueryOptions {
    /**
     * Time in milliseconds before data is considered stale
     * @default 30000 (30 seconds)
     */
    staleTime?: number;
    /**
     * Enable/disable the query
     * @default true
     */
    enabled?: boolean;
    /**
     * Interval for automatic refetching (in milliseconds)
     * @default 60000 (60 seconds)
     */
    refetchInterval?: number | false;
    /**
     * User ID for fetching exchanges for a specific user
     */
    userId?: string;
}

/**
 * Fetch all exchanges for current user
 * 
 * @example
 * const { data, isLoading, error } = useExchangesQuery();
 * const exchanges = data?.exchanges ?? [];
 */
export function useExchangesQuery(options?: UseExchangesQueryOptions) {
    const { userId, ...queryOptions } = options || {};

    return useQuery({
        queryKey: userId ? queryKeys.exchanges.list({ userId }) : queryKeys.exchanges.list(),
        queryFn: getExchanges,
        staleTime: queryOptions.staleTime ?? 30_000,
        enabled: queryOptions.enabled ?? true,
        refetchInterval: queryOptions.refetchInterval ?? 60_000,
    });
}
