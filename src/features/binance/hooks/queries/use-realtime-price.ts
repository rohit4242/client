/**
 * useRealtimePrice Hook
 * 
 * React Query hook for real-time price updates via WebSocket.
 * Falls back to REST API if WebSocket is unavailable.
 */

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/query-keys";
import { getSymbolPriceAction } from "../../actions";
import { usePriceContext } from "@/providers/price-provider";

export interface UseRealtimePriceOptions {
    /**
     * Exchange ID for REST API fallback
     */
    exchangeId: string;
    /**
     * Enable/disable the query
     * @default true
     */
    enabled?: boolean;
    /**
     * Use REST API instead of WebSocket
     * @default false
     */
    useRestApi?: boolean;
}

/**
 * Get real-time price for a symbol
 * 
 * Uses WebSocket for real-time updates with REST API fallback
 * 
 * @example
 * const { price, isLive, isLoading } = useRealtimePrice('BTCUSDT', { exchangeId });
 */
export function useRealtimePrice(
    symbol: string | null,
    options: UseRealtimePriceOptions
) {
    const { exchangeId, enabled = true, useRestApi = false } = options;
    const { prices, isConnected, subscribeToSymbols, unsubscribeFromSymbols } = usePriceContext();
    const [lastPrice, setLastPrice] = useState<string | null>(null);

    // Subscribe to WebSocket unless using REST API
    useEffect(() => {
        if (!symbol || useRestApi || !enabled) return;

        const normalizedSymbol = symbol.toUpperCase();
        subscribeToSymbols([normalizedSymbol]);

        return () => {
            unsubscribeFromSymbols([normalizedSymbol]);
        };
    }, [symbol, useRestApi, enabled, subscribeToSymbols, unsubscribeFromSymbols]);

    // Update last price from WebSocket
    useEffect(() => {
        if (!symbol || useRestApi) return;

        const normalizedSymbol = symbol.toUpperCase();
        const priceData = prices[normalizedSymbol];

        if (priceData?.price) {
            setLastPrice(priceData.price);
        }
    }, [symbol, prices, useRestApi]);

    // REST API fallback query
    const restQuery = useQuery({
        queryKey: queryKeys.binance.price(exchangeId, symbol || ""),
        queryFn: async () => {
            if (!symbol) return null;

            const result = await getSymbolPriceAction({ exchangeId, symbol });
            if (!result.success || !result.data) {
                throw new Error("Failed to fetch price");
            }

            return result.data;
        },
        enabled: enabled && !!symbol && (useRestApi || !isConnected),
        staleTime: 2_000, // 2 seconds
        refetchInterval: 5_000, // Refetch every 5 seconds as fallback
    });

    // Determine which price to use
    const price = useRestApi || !isConnected
        ? restQuery.data?.price || lastPrice
        : lastPrice;

    const isLive = !useRestApi && isConnected && !!prices[symbol?.toUpperCase() || ""];

    return {
        price,
        isLive,
        isConnected,
        isLoading: restQuery.isLoading,
        error: restQuery.error?.message || null,
        // Expose REST query for advanced use cases
        restQuery,
    };
}
