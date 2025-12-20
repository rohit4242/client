/**
 * useSymbolInfoQuery Hook
 * 
 * React Query hook for fetching symbol trading rules and filters.
 */

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/query-keys";
import { getSymbolInfoAction } from "../../actions/market/get-symbol-info";

export interface UseSymbolInfoQueryOptions {
    /**
     * Exchange ID
     */
    exchangeId: string;
    /**
     * Trading symbol
     */
    symbol: string;
    /**
     * Enable/disable the query
     * @default true
     */
    enabled?: boolean;
    /**
     * Time in milliseconds before data is considered stale
     * @default 3600000 (1 hour) - Symbol info rarely changes
     */
    staleTime?: number;
}

/**
 * Fetch symbol information including filters, precision, and trading rules
 * 
 * @example
 * const { data, isLoading } = useSymbolInfoQuery({ 
 *   exchangeId, 
 *   symbol: "BTCUSDT" 
 * });
 * 
 * // Access filters
 * const priceFilter = data?.filters.find(f => f.filterType === "PRICE_FILTER");
 * const minPrice = priceFilter?.minPrice;
 */
export function useSymbolInfoQuery(options: UseSymbolInfoQueryOptions) {
    const { exchangeId, symbol, enabled = true, staleTime = 3_600_000 } = options;

    return useQuery({
        queryKey: queryKeys.binance.symbolInfo(exchangeId, symbol),
        queryFn: async () => {
            const result = await getSymbolInfoAction({ exchangeId, symbol });

            if (!result.success || !result.data) {
                throw new Error("Failed to fetch symbol info");
            }

            return result.data;
        },
        enabled: enabled && !!exchangeId && !!symbol,
        staleTime, // Symbol info rarely changes, cache for 1 hour
        refetchInterval: false, // Don't auto-refetch
    });
}
