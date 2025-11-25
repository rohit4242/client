import { useQuery } from "@tanstack/react-query";
import { Exchange } from "@/types/exchange";
import { SpotRestAPI } from "@binance/spot";

interface UseSymbolInfoQueryOptions {
  /**
   * Time in milliseconds before data is considered stale
   * Default: 300000 (5 minutes) - symbol info rarely changes
   */
  staleTime?: number;
  /**
   * Enable/disable the query
   * Default: true if symbol and exchange are provided
   */
  enabled?: boolean;
}

/**
 * React Query hook to fetch symbol information (filters, precision, etc.)
 * Symbol info rarely changes, so uses long cache time (5 minutes)
 * 
 * @param symbol - Trading symbol (e.g., 'BTCUSDT')
 * @param exchange - Exchange configuration
 * @param options - Query options
 * @returns Query result with symbol info
 * 
 * @example
 * const { data: symbolInfo, isLoading } = useSymbolInfoQuery('BTCUSDT', exchange);
 */
export function useSymbolInfoQuery(
  symbol: string | null,
  exchange: Exchange | null,
  options?: UseSymbolInfoQueryOptions
) {
  return useQuery<SpotRestAPI.ExchangeInfoResponse | null, Error>({
    queryKey: ['symbolInfo', symbol, exchange?.id],
    queryFn: async () => {
      if (!symbol || !exchange) {
        return null;
      }

      const response = await fetch(`/api/account/exchange`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          apiKey: exchange.apiKey,
          apiSecret: exchange.apiSecret,
          symbol: symbol,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch symbol info");
      }

      const data = await response.json();

      return data.exchangeInfo || null;
    },
    staleTime: options?.staleTime ?? 300000, // 5 minutes default
    enabled: options?.enabled ?? (!!symbol && !!exchange),
  });
}

