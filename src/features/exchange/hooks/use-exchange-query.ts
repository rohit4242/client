/**
 * useExchangeQuery Hook
 * 
 * React Query hook for fetching a single exchange by ID.
 */

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/query-keys";
import { getExchange } from "../actions/get-exchange";

export interface UseExchangeQueryOptions {
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
}

/**
 * Fetch single exchange by ID
 * 
 * @param id - Exchange ID
 * @param options - Query options
 * 
 * @example
 * const { data, isLoading, error } = useExchangeQuery(exchangeId);
 * const exchange = data?.exchange;
 */
export function useExchangeQuery(
    id: string | undefined,
    options?: UseExchangeQueryOptions
) {
    return useQuery({
        queryKey: queryKeys.exchanges.detail(id ?? ""),
        queryFn: () => {
            if (!id) throw new Error("Exchange ID is required");
            return getExchange(id);
        },
        staleTime: options?.staleTime ?? 30_000,
        enabled: (options?.enabled ?? true) && !!id,
    });
}
