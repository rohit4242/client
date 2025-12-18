/**
 * useOrdersQuery Hook
 * 
 * React Query hook for fetching orders with filters.
 */

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/query-keys";
import { getOrders } from "../actions/get-orders";
import type { GetOrdersInput } from "../types/order.types";

export interface UseOrdersQueryOptions {
    /**
     * Time in milliseconds before data is considered stale
     * @default 15000 (15 seconds)
     */
    staleTime?: number;
    /**
     * Enable/disable the query
     * @default true
     */
    enabled?: boolean;
    /**
     * Interval for automatic refetching (in milliseconds)
     * @default 30000 (30 seconds)
     */
    refetchInterval?: number | false;
}

/**
 * Fetch orders with optional filters
 * 
 * @param filters - Optional filters (positionId, symbol, status, type, limit)
 * @param options - Query options
 * 
 * @example
 * const { data, isLoading } = useOrdersQuery({ positionId });
 * const orders = data?.orders ?? [];
 */
export function useOrdersQuery(
    filters?: GetOrdersInput,
    options?: UseOrdersQueryOptions
) {
    return useQuery({
        queryKey: queryKeys.orders.list(filters?.positionId),
        queryFn: () => getOrders(filters),
        staleTime: options?.staleTime ?? 15_000,
        enabled: options?.enabled ?? true,
        refetchInterval: options?.refetchInterval ?? 30_000,
    });
}
