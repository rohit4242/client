/**
 * useCreateExchangeMutation Hook
 * 
 * React Query mutation hook for creating a new exchange.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/lib/query/query-keys";
import { createExchange } from "../actions/create-exchange";
import type { CreateExchangeInput } from "../types/exchange.types";

/**
 * Create new exchange with automatic cache invalidation
 * 
 * @example
 * const createMutation = useCreateExchangeMutation();
 * 
 * const handleCreate = (data: CreateExchangeInput) => {
 *   createMutation.mutate(data);
 * };
 */
export function useCreateExchangeMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createExchange,
        onSuccess: (result) => {
            if (result.success) {
                // Invalidate exchanges list
                queryClient.invalidateQueries({ queryKey: queryKeys.exchanges.all() });

                // Invalidate portfolio (may have been created)
                queryClient.invalidateQueries({ queryKey: queryKeys.portfolio.all() });

                toast.success("Exchange created successfully");
            } else {
                toast.error(result.error || "Failed to create exchange");
            }
        },
        onError: (error: Error) => {
            toast.error(error.message || "An unexpected error occurred");
        },
    });
}
