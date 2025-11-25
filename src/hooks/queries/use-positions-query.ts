import { useQuery } from "@tanstack/react-query";
import { Position } from "@prisma/client";

interface UsePositionsQueryOptions {
  /**
   * Time in milliseconds before data is considered stale
   * Default: 10000 (10 seconds)
   */
  staleTime?: number;
  /**
   * Refetch interval in milliseconds
   * Default: false (manual refetch only)
   */
  refetchInterval?: number | false;
  /**
   * Filter positions by status
   */
  status?: 'OPEN' | 'CLOSED' | 'PENDING';
  /**
   * Filter positions by account type
   */
  accountType?: 'SPOT' | 'MARGIN';
}

/**
 * React Query hook to fetch user positions
 * Auto-refetches on window focus to keep positions fresh
 * 
 * @param options - Query options and filters
 * @returns Query result with positions data
 * 
 * @example
 * const { data: positions, isLoading, refetch } = usePositionsQuery({ status: 'OPEN' });
 */
export function usePositionsQuery(options?: UsePositionsQueryOptions) {
  return useQuery<Position[], Error>({
    queryKey: ['positions', options?.status, options?.accountType],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (options?.status) params.append('status', options.status);
      if (options?.accountType) params.append('accountType', options.accountType);

      const response = await fetch(`/api/positions?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to fetch positions");
      }

      const data = await response.json();
      return data.positions || [];
    },
    staleTime: options?.staleTime ?? 10000, // 10 seconds default
    refetchInterval: options?.refetchInterval ?? false,
    refetchOnWindowFocus: true, // Always refetch when user returns
  });
}

