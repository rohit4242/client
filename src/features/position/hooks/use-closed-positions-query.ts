/**
 * useClosedPositionsQuery Hook
 * 
 * React Query hook for fetching closed positions only.
 */

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/query-keys";
import { getClosedPositions } from "../actions/get-positions";

export interface UseClosedPositionsQueryOptions {
    /**
     * Time in milliseconds before data is considered stale
     * @default 60000 (60 seconds) - Closed positions don't change
     */
    staleTime?: number;
    /**
     * Enable/disable the query
     * @default true
     */
    enabled?: boolean;
}

/**
 * Fetch closed positions only
 * Long stale time since closed positions don't change
 * 
 * @example
 * const { data, isLoading } = use ClosedPositionsQuery();
 * const closedPositions = data?.positions ?? [];
 */
export function useClosedPositionsQuery(options?: UseClosedPositionsQueryOptions) {
    return useQuery({
        queryKey: queryKeys.positions.list({ status: "CLOSED" }),
        queryFn: getClosedPositions,
        staleTime: options?.staleTime ?? 60_000,
        enabled: options?.enabled ?? true,
        // No auto-refetch for closed positions
        refetchInterval: false,
    });
}
