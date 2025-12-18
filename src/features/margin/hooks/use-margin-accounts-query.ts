/**
 * useMarginAccountsQuery Hook
 * 
 * React Query hook for fetching margin accounts.
 */

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/query-keys";
import { getMarginAccounts } from "../actions/get-margin-accounts";
import type { GetMarginAccountsInput } from "../types/margin.types";

export interface UseMarginAccountsQueryOptions {
    /**
     * Time in milliseconds before data is considered stale
     * @default 15000 (15 seconds) - Margin data changes moderately
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
 * Fetch margin accounts with health calculations
 * 
 * @param filters - Optional filters (exchangeId)
 * @param options - Query options
 * 
 * @example
 * const { data, isLoading } = useMarginAccountsQuery();
 * const accounts = data?.accounts ?? [];
 */
export function useMarginAccountsQuery(
    filters?: GetMarginAccountsInput,
    options?: UseMarginAccountsQueryOptions
) {
    return useQuery({
        queryKey: queryKeys.margin.all(),
        queryFn: () => getMarginAccounts(filters),
        staleTime: options?.staleTime ?? 15_000,
        enabled: options?.enabled ?? true,
        refetchInterval: options?.refetchInterval ?? 30_000,
    });
}
