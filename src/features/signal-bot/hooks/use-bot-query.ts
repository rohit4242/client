/**
 * useBotQuery Hook
 * 
 * React Query hook for fetching a single signal bot by ID.
 */

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/query-keys";
import { getBot } from "../actions/get-bot";

export interface UseBotQueryOptions {
    /**
     * Time in milliseconds before data is considered stale
     * @default 30000 (30 seconds)
     */
    staleTime?: number;
    /**
     * Enable/disable the query
     * @default true
     */
    enabled?: boolean;
}

/**
 * Fetch single signal bot by ID
 * 
 * @param id - Bot ID
 * @param options - Query options
 * 
 * @example
 * const { data, isLoading } = useBotQuery(botId);
 * const bot = data?.bot;
 */
export function useBotQuery(
    id: string | undefined,
    options?: UseBotQueryOptions
) {
    return useQuery({
        queryKey: queryKeys.bots.detail(id ?? ""),
        queryFn: () => {
            if (!id) throw new Error("Bot ID is required");
            return getBot(id);
        },
        staleTime: options?.staleTime ?? 30_000,
        enabled: (options?.enabled ?? true) && !!id,
    });
}
