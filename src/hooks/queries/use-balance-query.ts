import { useQuery } from "@tanstack/react-query";
import { type ExchangeClient } from "@/features/exchange";
import { AssetBalance } from "@/types/trading";
import { ApiSuccessResponse } from "@/types/api";

interface UseBalanceQueryOptions {
  /**
   * Time in milliseconds before data is considered stale
   * Default: 30000 (30 seconds)
   */
  staleTime?: number;
  /**
   * Enable/disable the query
   * Default: true if asset and exchange are provided
   */
  enabled?: boolean;
}

/**
 * React Query hook to fetch spot balance for a specific asset
 * Uses smart caching to reduce API calls
 * 
 * @param asset - Asset symbol (e.g., 'BTC', 'USDT')
 * @param exchange - Exchange configuration
 * @param options - Query options
 * @returns Query result with balance data
 * 
 * @example
 * const { data: balance, isLoading, error } = useBalanceQuery('USDT', exchange);
 */
export function useBalanceQuery(
  asset: string | null | undefined,
  exchange: ExchangeClient | null,
  options?: UseBalanceQueryOptions
) {
  return useQuery<AssetBalance | null | AssetBalance[], Error>({
    queryKey: ['balance', asset || 'all', exchange?.id],
    queryFn: async () => {
      console.log('[useBalanceQuery] Fetching balance for asset:', asset || 'all');

      if (!exchange) {
        console.log('[useBalanceQuery] Missing exchange');
        return null;
      }

      // Call new unified balance API
      const response = await fetch('/api/trading/balance/spot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          asset,
          apiKey: exchange.apiKey,
          apiSecret: exchange.apiSecret,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch balance');
      }

      const result: ApiSuccessResponse<AssetBalance | AssetBalance[]> = await response.json();

      console.log('[useBalanceQuery] Got result:', result);
      console.log('[useBalanceQuery] Returning data:', result.data);

      return result.data || null;
    },
    staleTime: options?.staleTime ?? 30000, // 30 seconds default
    enabled: options?.enabled ?? (!!exchange),
    retry: 2, // Retry failed requests twice
    refetchOnMount: true, // Always fetch fresh data on mount
  });
}

