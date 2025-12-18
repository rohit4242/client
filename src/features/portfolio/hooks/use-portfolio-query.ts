/**
 * usePortfolioQuery Hook
 * 
 * React Query hook for fetching portfolio.
 */

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/query-keys";
import { getPortfolio } from "../actions/get-portfolio";

export interface UsePortfolioQueryOptions {
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
}

/**
 * Fetch portfolio for current user
 * 
 * @example
 * const { data, isLoading, error } = usePortfolioQuery();
 * const portfolio = data?.portfolio;
 */
export function usePortfolioQuery(options?: UsePortfolioQueryOptions) {
    return useQuery({
        queryKey: queryKeys.portfolio.all(),
        queryFn: getPortfolio,
        staleTime: options?.staleTime ?? 30_000,
        enabled: options?.enabled ?? true,
        refetchInterval: options?.refetchInterval ?? 60_000,
    });
}
