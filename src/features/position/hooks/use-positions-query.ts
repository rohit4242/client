/**
 * usePositionsQuery Hook
 * 
 * React Query hook for fetching positions with filters and pagination.
 */

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/query-keys";
import { getPositions } from "../actions/get-positions";
import type { GetPositionsInput } from "../types/position.types";

export interface UsePositionsQueryOptions {
    /**
     * Time in milliseconds before data is considered stale
     * @default 10000 (10 seconds) - Positions change frequently
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
 * Fetch positions with optional filters and pagination
 * 
 * @param filters - Optional filters (status, symbol, accountType, source, page, pageSize, limit)
 * @param options - Query options
 * 
 * @example
 * const { data, isLoading } = usePositionsQuery({ status: "OPEN", page: 1, pageSize: 20 });
 * const positions = data?.positions ?? [];
 */
export function usePositionsQuery(
    filters?: GetPositionsInput,
    options?: UsePositionsQueryOptions
) {
    return useQuery({
        queryKey: queryKeys.positions.list(filters),
        queryFn: () => getPositions(filters),
        staleTime: options?.staleTime ?? 10_000,
        enabled: options?.enabled ?? true,
        refetchInterval: options?.refetchInterval ?? 30_000,
        // Keep previous data while fetching next page for smooth transitions
        placeholderData: keepPreviousData,
    });
}
