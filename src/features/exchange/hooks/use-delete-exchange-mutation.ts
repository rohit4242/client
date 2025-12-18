/**
 * useDeleteExchangeMutation Hook
 * 
 * React Query mutation hook for deleting an exchange.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/lib/query/query-keys";
import { deleteExchange } from "../actions/delete-exchange";
import type { DeleteExchangeInput } from "../types/exchange.types";

/**
 * Delete exchange with automatic cache invalidation
 * 
 * @example
 * const deleteMutation = useDeleteExchangeMutation();
 * 
 * const handleDelete = (id: string) => {
 *   deleteMutation.mutate({ id });
 * };
 */
export function useDeleteExchangeMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteExchange,
        onSuccess: (result, variables) => {
            if (result.success) {
                // Invalidate exchanges list
                queryClient.invalidateQueries({ queryKey: queryKeys.exchanges.all() });

                // Remove specific exchange from cache
                queryClient.removeQueries({
                    queryKey: queryKeys.exchanges.detail(variables.id)
                });

                // Invalidate related data
                queryClient.invalidateQueries({ queryKey: queryKeys.bots.all() });
                queryClient.invalidateQueries({ queryKey: queryKeys.positions.all() });

                toast.success("Exchange deleted successfully");
            } else {
                toast.error(result.error || "Failed to delete exchange");
            }
        },
        onError: (error: Error) => {
            toast.error(error.message || "An unexpected error occurred");
        },
    });
}
