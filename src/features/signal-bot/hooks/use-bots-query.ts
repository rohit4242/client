/**
 * useBotsQuery Hook
 * 
 * React Query hook for fetching signal bots with filters.
 */

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/query-keys";
import { getBots } from "../actions/get-bots";
import type { GetBotsInput } from "../types/bot.types";

export interface UseBotsQueryOptions {
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
    /**
     * Initial data for hydration
     */
    initialData?: any;
}

/**
 * Fetch signal bots with optional filters
 * 
 * @param filters - Optional filters (isActive, accountType)
 * @param options - Query options
 * 
 * @example
 * const { data, isLoading } = useBotsQuery({ isActive: true });
 * const bots = data?.bots ?? [];
 */
export function useBotsQuery(
    filters?: GetBotsInput,
    options?: UseBotsQueryOptions
) {
    return useQuery({
        queryKey: queryKeys.bots.list(filters),
        queryFn: () => getBots(filters),
        staleTime: options?.staleTime ?? 30_000,
        enabled: options?.enabled ?? true,
        refetchInterval: options?.refetchInterval ?? 60_000,
        initialData: options?.initialData,
    });
}
