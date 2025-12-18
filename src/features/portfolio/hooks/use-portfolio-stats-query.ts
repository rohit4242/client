/**
 * usePortfolioStatsQuery Hook
 * 
 * React Query hook for fetching portfolio statistics.
 */

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/query-keys";
import { getPortfolioStats } from "../actions/get-portfolio-stats";

export interface UsePortfolioStatsQueryOptions {
    /**
     * Time in milliseconds before data is considered stale
     * @default 10000 (10 seconds) - Stats should be fresh
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
 * Fetch portfolio statistics
 * Returns comprehensive performance metrics
 * 
 * @example
 * const { data, isLoading } = usePortfolioStatsQuery();
 * const stats = data?.stats;
 * 
 * if (stats) {
 *   console.log('Total PnL:', stats.totalPnl);
 *   console.log('Win Rate:', stats.winRate);
 * }
 */
export function usePortfolioStatsQuery(options?: UsePortfolioStatsQueryOptions) {
    return useQuery({
        queryKey: queryKeys.portfolio.stats(),
        queryFn: getPortfolioStats,
        staleTime: options?.staleTime ?? 10_000,
        enabled: options?.enabled ?? true,
        refetchInterval: options?.refetchInterval ?? 30_000,
    });
}
