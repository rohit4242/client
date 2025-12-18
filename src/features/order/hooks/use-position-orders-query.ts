/**
 * usePositionOrdersQuery Hook
 * 
 * React Query hook for fetching orders for a specific position.
 */

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/query-keys";
import { getOrdersByPosition } from "../actions/get-orders";

export interface UsePositionOrdersQueryOptions {
    /**
     * Time in milliseconds before data is considered stale
     * @default 10000 (10 seconds) - Position orders change frequently
     */
    staleTime?: number;
    /**
     * Enable/disable the query
     * @default true
     */
    enabled?: boolean;
    /**
     * Interval for automatic refetching (in milliseconds)
     * @default 20000 (20 seconds)
     */
    refetchInterval?: number | false;
}

/**
 * Fetch orders for a specific position
 * Optimized for position detail pages
 * 
 * @param positionId - Position ID
 * @param options - Query options
 * 
 * @example
 * const { data, isLoading } = usePositionOrdersQuery(positionId);
 * const orders = data?.orders ?? [];
 */
export function usePositionOrdersQuery(
    positionId: string | undefined,
    options?: UsePositionOrdersQueryOptions
) {
    return useQuery({
        queryKey: queryKeys.orders.list(positionId),
        queryFn: () => {
            if (!positionId) throw new Error("Position ID is required");
            return getOrdersByPosition(positionId);
        },
        staleTime: options?.staleTime ?? 10_000,
        enabled: (options?.enabled ?? true) && !!positionId,
        refetchInterval: options?.refetchInterval ?? 20_000,
    });
}
