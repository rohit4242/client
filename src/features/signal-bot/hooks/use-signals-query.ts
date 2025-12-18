/**
 * useSignalsQuery Hook
 * 
 * React Query hook for fetching signals.
 */

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/query-keys";
import type { GetSignalsInput } from "../types/bot.types";

import { getSignals } from "../actions/get-signals";

export interface UseSignalsQueryOptions {
    /**
     * Time in milliseconds before data is considered stale
     * @default 10000 (10 seconds) - Signals change frequently
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
 * Fetch signals with optional filters
 * 
 * @param filters - Optional filters (botId, processed, limit)
 * @param options - Query options
 * 
 * @example
 * const { data, isLoading } = useSignalsQuery({ botId });
 * const signals = data?.signals ?? [];
 */
export function useSignalsQuery(
    filters?: GetSignalsInput,
    options?: UseSignalsQueryOptions
) {
    return useQuery({
        queryKey: queryKeys.signals.list(filters?.botId),
        queryFn: () => getSignals(filters),
        staleTime: options?.staleTime ?? 10_000,
        enabled: options?.enabled ?? true,
        refetchInterval: options?.refetchInterval ?? 15_000,
    });
}
