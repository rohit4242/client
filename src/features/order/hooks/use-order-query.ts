/**
 * useOrderQuery Hook
 * 
 * React Query hook for fetching a single order by ID.
 */

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/query-keys";
import { getOrder } from "../actions/get-order";

export interface UseOrderQueryOptions {
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
}

/**
 * Fetch single order by ID
 * 
 * @param id - Order ID
 * @param options - Query options
 * 
 * @example
 * const { data, isLoading } = useOrderQuery(orderId);
 * const order = data?.order;
 */
export function useOrderQuery(
    id: string | undefined,
    options?: UseOrderQueryOptions
) {
    return useQuery({
        queryKey: queryKeys.orders.detail(id ?? ""),
        queryFn: () => {
            if (!id) throw new Error("Order ID is required");
            return getOrder({ id });
        },
        staleTime: options?.staleTime ?? 15_000,
        enabled: (options?.enabled ?? true) && !!id,
    });
}
