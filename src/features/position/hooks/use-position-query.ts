/**
 * usePositionQuery Hook
 * 
 * React Query hook for fetching a single position by ID.
 */

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/query-keys";
import { getPosition } from "../actions/get-position";

export interface UsePositionQueryOptions {
    /**
     * Time in milliseconds before data is considered stale
     * @default 10000 (10 seconds)
     */
    staleTime?: number;
    /**
     * Enable/disable the query
     * @default true
     */
    enabled?: boolean;
}

/**
 * Fetch single position by ID
 * 
 * @param id - Position ID
 * @param options - Query options
 * 
 * @example
 * const { data, isLoading } = usePositionQuery(positionId);
 * const position = data?.position;
 */
export function usePositionQuery(
    id: string | undefined,
    options?: UsePositionQueryOptions
) {
    return useQuery({
        queryKey: queryKeys.positions.detail(id ?? ""),
        queryFn: () => {
            if (!id) throw new Error("Position ID is required");
            return getPosition({ id });
        },
        staleTime: options?.staleTime ?? 10_000,
        enabled: (options?.enabled ?? true) && !!id,
    });
}
