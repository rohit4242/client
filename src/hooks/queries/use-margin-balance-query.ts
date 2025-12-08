import { useQuery } from "@tanstack/react-query";
import { Exchange } from "@/types/exchange";
import { ApiSuccessResponse } from "@/types/api";

export interface MarginAssetBalance {
  asset: string;
  free: string;
  locked: string;
  borrowed: string;
  interest: string;
  netAsset: string;
}

interface UseMarginBalanceQueryOptions {
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
  /**
   * Refetch interval in milliseconds
   * Default: disabled (use manual refetch)
   */
  refetchInterval?: number | false;
}

/**
 * React Query hook to fetch margin balance for a specific asset
 * Includes borrowed amounts, interest, and net asset value
 * 
 * @param asset - Asset symbol (e.g., 'BTC', 'USDT')
 * @param exchange - Exchange configuration
 * @param options - Query options
 * @returns Query result with margin balance data
 * 
 * @example
 * const { data: balance, isLoading, error } = useMarginBalanceQuery('USDT', exchange);
 */
export function useMarginBalanceQuery(
  asset: string | null | undefined,
  exchange: Exchange | null,
  options?: UseMarginBalanceQueryOptions
) {
  return useQuery<MarginAssetBalance | null | MarginAssetBalance[], Error>({
    queryKey: ['marginBalance', asset || 'all', exchange?.id],
    queryFn: async () => {
      console.log('[useMarginBalanceQuery] Fetching margin balance for asset:', asset || 'all');

      if (!asset || !exchange) {
        console.log('[useMarginBalanceQuery] Missing asset or exchange:', { asset, hasExchange: !!exchange });
        return null;
      }

      // Call new unified margin balance API
      const response = await fetch('/api/trading/balance/margin', {
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
        throw new Error(error.error || 'Failed to fetch margin balance');
      }

      const result: ApiSuccessResponse<MarginAssetBalance | MarginAssetBalance[]> = await response.json();

      console.log('[useMarginBalanceQuery] Got result:', result);

      return result.data || null;
    },
    staleTime: options?.staleTime ?? 30000, // 30 seconds default
    enabled: options?.enabled ?? (!!exchange),
    refetchInterval: options?.refetchInterval ?? false,
    retry: 2, // Retry failed requests twice
    refetchOnMount: true, // Always fetch fresh data on mount
  });
}

