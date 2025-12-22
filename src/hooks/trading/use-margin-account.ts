import { useQuery } from '@tanstack/react-query';
import { MarginAccountInfo, MarginAccountStats } from '@/types/margin';
import { REFRESH_INTERVALS } from '@/lib/margin/margin-constants';
import axios from 'axios';
import { type ExchangeClient } from '@/features/exchange';

interface MarginAccountResponse {
  success: boolean;
  data: MarginAccountInfo & {
    stats: MarginAccountStats;
  };
}

/**
 * Hook to fetch and monitor margin account information
 * @param exchangeId - Optional exchange ID
 * @param enabled - Whether the query should run
 */
export const useMarginAccount = (
  exchange?: ExchangeClient,
  enabled: boolean = true
) => {
  return useQuery<MarginAccountResponse>({
    queryKey: ['marginAccount', exchange?.id],
    queryFn: async () => {
      console.log("fetching margin account");
      const response = await axios.post('/api/margin/account', {
        apiKey: exchange?.apiKey,
        apiSecret: exchange?.apiSecret,
      });

      console.log("margin account response: ", response.data);
      return response.data;
    },
    refetchInterval: REFRESH_INTERVALS.MARGIN_ACCOUNT, // Refresh every 10 seconds
    enabled: enabled && !!exchange?.id,
    staleTime: 5000, // Consider data stale after 5 seconds
  });
};

