/**
 * useMarginBalanceQuery Hook
 * 
 * React Query hook for fetching margin account balance.
 */

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/query-keys";
import { getMarginBalanceAction } from "../../actions/margin/get-margin-balance";

export interface UseMarginBalanceQueryOptions {
    /**
     * Exchange ID
     */
    exchangeId: string;
    /**
     * User ID (for admin viewing selected user's data)
     */
    userId?: string;
    /**
     * Enable/disable the query
     * @default true
     */
    enabled?: boolean;
    /**
     * Time in milliseconds before data is considered stale
     * @default 10000 (10 seconds)
     */
    staleTime?: number;
    /**
     * Interval for automatic refetching (in milliseconds)
     * @default 30000 (30 seconds)
     */
    refetchInterval?: number | false;
}

/**
 * Fetch margin account balance
 * 
 * @example
 * const { data, isLoading } = useMarginBalanceQuery({ exchangeId });
 * const marginLevel = parseFloat(data?.marginLevel ?? "0");
 */
export function useMarginBalanceQuery(options: UseMarginBalanceQueryOptions) {
    const { exchangeId, userId, enabled = true, staleTime = 10_000, refetchInterval = 30_000 } = options;

    return useQuery({
        queryKey: queryKeys.binance.balance(exchangeId, "MARGIN"),
        queryFn: async () => {
            // Pass userId if provided (for admin viewing selected user data)
            const result = await getMarginBalanceAction({
                exchangeId,
                userId: userId || "" // Will use selectedUser in action if empty
            });

            if (!result.success) {
                // Use the actual error message from the backend
                throw new Error(result.error || "Failed to fetch margin balance");
            }

            return result.data;
        },
        enabled: enabled && !!exchangeId,
        staleTime,
        refetchInterval,
    });
}
