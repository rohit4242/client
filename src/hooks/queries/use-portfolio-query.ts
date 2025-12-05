import { useQuery } from "@tanstack/react-query";

interface Portfolio {
  id: string;
  userId: string;
  totalBalance: number;
  totalPnl: number;
  winRate: number;
  totalTrades: number;
  createdAt: Date;
  updatedAt: Date;
}

interface UsePortfolioQueryOptions {
  /**
   * Time in milliseconds before data is considered stale
   * Default: 10000 (10 seconds)
   */
  staleTime?: number;
  /**
   * Enable/disable the query
   * Default: true
   */
  enabled?: boolean;
  /**
   * Interval for automatic refetching (in milliseconds)
   * Default: 30000 (30 seconds)
   */
  refetchInterval?: number | false;
}

/**
 * React Query hook to fetch portfolio statistics
 * Includes total balance, PnL, win rate, and trade count
 * 
 * @param options - Query options
 * @returns Query result with portfolio data
 * 
 * @example
 * const { data: portfolio, isLoading, error } = usePortfolioQuery();
 */
export function usePortfolioQuery(options?: UsePortfolioQueryOptions) {
  return useQuery<Portfolio | null, Error>({
    queryKey: ['portfolio'],
    queryFn: async () => {
      const response = await fetch('/api/portfolio');

      if (!response.ok) {
        throw new Error("Failed to fetch portfolio");
      }

      const data = await response.json();
      return data.portfolio || null;
    },
    staleTime: options?.staleTime ?? 10000, // 10 seconds - data becomes stale quickly
    enabled: options?.enabled ?? true,
    refetchInterval: options?.refetchInterval ?? 30000, // Poll every 30 seconds by default
  });
}

