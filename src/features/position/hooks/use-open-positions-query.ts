/**
 * useOpenPositionsQuery Hook
 * 
 * React Query hook for fetching open positions only.
 */

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/query-keys";
import { getOpenPositions } from "../actions/get-positions";

export interface UseOpenPositionsQueryOptions {
    /**
     * Time in milliseconds before data is considered stale
     * @default 5000 (5 seconds) - Open positions change rapidly
     */
    staleTime?: number;
    /**
     * Enable/disable the query
     * @default true
     */
    enabled?: boolean;
    /**
     * Interval for automatic refetching (in milliseconds)
     * @default 15000 (15 seconds)
     */
    refetchInterval?: number | false;
}

/**
 * Fetch open positions only
 * Optimized for frequent updates
 * 
 * @example
 * const { data, isLoading } = useOpenPositionsQuery();
 * const openPositions = data?.positions ?? [];
 */
export function useOpenPositionsQuery(options?: UseOpenPositionsQueryOptions) {
    return useQuery({
        queryKey: queryKeys.positions.list({ status: "OPEN" }),
        queryFn: getOpenPositions,
        staleTime: options?.staleTime ?? 5_000,
        enabled: options?.enabled ?? true,
        refetchInterval: options?.refetchInterval ?? 15_000,
    });
}
