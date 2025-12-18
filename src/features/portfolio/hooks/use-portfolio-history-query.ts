/**
 * usePortfolioHistoryQuery Hook
 * 
 * React Query hook for fetching portfolio history for charts.
 */

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/query-keys";
import { getPortfolioHistory } from "../actions/get-portfolio-history";
import type { GetPortfolioHistoryInput } from "../types/portfolio.types";

export interface UsePortfolioHistoryQueryOptions {
    /**
     * Time in milliseconds before data is considered stale
     * @default 60000 (60 seconds) - History data doesn't change rapidly
     */
    staleTime?: number;
    /**
     * Enable/disable the query
     * @default true
     */
    enabled?: boolean;
}

/**
 * Fetch portfolio history for charts
 * 
 * @param period - Time period for history (day, week, month, year, all)
 * @param options - Query options
 * 
 * @example
 * const { data, isLoading } = usePortfolioHistoryQuery({ period: "month" });
 * const chartData = data?.data ?? [];
 */
export function usePortfolioHistoryQuery(
    input: GetPortfolioHistoryInput = { period: "month" },
    options?: UsePortfolioHistoryQueryOptions
) {
    return useQuery({
        queryKey: queryKeys.portfolio.history(input.period),
        queryFn: () => getPortfolioHistory(input),
        staleTime: options?.staleTime ?? 60_000,
        enabled: options?.enabled ?? true,
    });
}
