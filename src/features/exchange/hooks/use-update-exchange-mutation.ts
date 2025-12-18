/**
 * useUpdateExchangeMutation Hook
 * 
 * React Query mutation hook for updating an exchange.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/lib/query/query-keys";
import { updateExchange } from "../actions/update-exchange";
import type { UpdateExchangeInput } from "../types/exchange.types";

/**
 * Update exchange with automatic cache invalidation
 * 
 * @example
 * const updateMutation = useUpdateExchangeMutation();
 * 
 * const handleUpdate = (data: UpdateExchangeInput) => {
 *   updateMutation.mutate(data);
 * };
 */
export function useUpdateExchangeMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updateExchange,
        onSuccess: (result, variables) => {
            if (result.success) {
                // Invalidate exchanges list
                queryClient.invalidateQueries({ queryKey: queryKeys.exchanges.list() });

                // Invalidate specific exchange
                queryClient.invalidateQueries({
                    queryKey: queryKeys.exchanges.detail(variables.id)
                });

                toast.success("Exchange updated successfully");
            } else {
                toast.error(result.error || "Failed to update exchange");
            }
        },
        onError: (error: Error) => {
            toast.error(error.message || "An unexpected error occurred");
        },
    });
}
