/**
 * useMaxBorrowableQuery Hook
 * 
 * React Query hook for fetching maximum borrowable amount.
 */

import { useQuery } from "@tanstack/react-query";
import { getMaxBorrowableAction } from "../../actions/margin/get-max-borrowable";

export interface UseMaxBorrowableQueryOptions {
    /**
     * Exchange ID
     */
    exchangeId: string;
    /**
     * Asset to check
     */
    asset: string;
    /**
     * Enable/disable the query
     * @default true
     */
    enabled?: boolean;
    /**
     * Time in milliseconds before data is considered stale
     * @default 30000 (30 seconds)
     */
    staleTime?: number;
}

/**
 * Fetch maximum borrowable amount for an asset
 * 
 * @example
 * const { data, isLoading } = useMaxBorrowableQuery({ 
 *   exchangeId, 
 *   asset: "USDT" 
 * });
 * 
 * const maxBorrow = data?.amount ?? 0;
 */
export function useMaxBorrowableQuery(options: UseMaxBorrowableQueryOptions) {
    const { exchangeId, asset, enabled = true, staleTime = 30_000 } = options;

    return useQuery({
        queryKey: ["binance", "max-borrowable", exchangeId, asset],
        queryFn: async () => {
            const result = await getMaxBorrowableAction({ exchangeId, asset });

            if (!result.success || !result.data) {
                throw new Error("Failed to fetch max borrowable");
            }

            return result.data;
        },
        enabled: enabled && !!exchangeId && !!asset,
        staleTime,
        refetchInterval: 60_000, // Refetch every minute
    });
}
