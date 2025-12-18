/**
 * useBotsStatsQuery hook
 * 
 * Fetches overall statistics for signal bots.
 */

import { useQuery } from "@tanstack/react-query";
import { getBotsStats } from "../actions/get-bots-stats";

interface UseBotsStatsQueryParams {
    userId?: string;
    enabled?: boolean;
    initialData?: any;
}

export function useBotsStatsQuery(params: UseBotsStatsQueryParams = {}) {
    const { userId, enabled = true, initialData } = params;

    return useQuery({
        queryKey: ["bots-stats", userId],
        queryFn: async () => {
            const result = await getBotsStats({ userId });
            if (!result.success) {
                throw new Error(result.error || "Failed to fetch bot statistics");
            }
            return result.data;
        },
        enabled,
        staleTime: 60000, // 1 minute
        initialData,
    });
}
