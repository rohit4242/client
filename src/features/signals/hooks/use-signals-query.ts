"use client";

import { useQuery } from "@tanstack/react-query";
import { getSignals } from "../actions/get-signals";
import { GetSignalsInput } from "../types/signal.types";

export interface UseSignalsQueryOptions {
    staleTime?: number;
    enabled?: boolean;
    refetchInterval?: number | false;
}

/**
 * Fetch all signals with filters for admin
 */
export function useSignalsQuery(
    filters: GetSignalsInput = {},
    options: UseSignalsQueryOptions = {}
) {
    return useQuery({
        queryKey: ["admin-signals", filters],
        queryFn: () => getSignals(filters),
        staleTime: options.staleTime ?? 15_000,
        enabled: options.enabled ?? true,
        refetchInterval: options.refetchInterval ?? 30_000,
    });
}
