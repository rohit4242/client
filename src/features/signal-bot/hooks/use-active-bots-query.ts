/**
 * useActiveBotsQuery Hook
 * 
 * React Query hook for fetching active signal bots only.
 */

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/query-keys";
import { getActiveBots } from "../actions/get-bots";

export interface UseActiveBotsQueryOptions {
    /**
     * Time in milliseconds before data is considered stale
     * @default 20000 (20 seconds) - Active bots change more frequently
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
 * Fetch active signal bots only
 * Optimized for dashboard and active monitoring
 * 
 * @example
 * const { data, isLoading } = useActiveBotsQuery();
 * const activeBots = data?.bots ?? [];
 */
export function useActiveBotsQuery(options?: UseActiveBotsQueryOptions) {
    return useQuery({
        queryKey: queryKeys.bots.list({ isActive: true }),
        queryFn: getActiveBots,
        staleTime: options?.staleTime ?? 20_000,
        enabled: options?.enabled ?? true,
        refetchInterval: options?.refetchInterval ?? 30_000,
    });
}
