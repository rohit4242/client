/**
 * useDeleteBotMutation Hook
 * 
 * React Query mutation hook for deleting a signal bot.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/lib/query/query-keys";
import type { DeleteBotInput } from "../types/bot.types";

import { deleteBot } from "../actions/delete-bot";
import { toggleBot } from "../actions/toggle-bot";

/**
 * Delete signal bot with automatic cache invalidation
 * 
 * @example
 * const deleteMutation = useDeleteBotMutation();
 * 
 * const handleDelete = (id: string) => {
 *   deleteMutation.mutate({ id });
 * };
 */
export function useDeleteBotMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteBot,
        onSuccess: (result, variables) => {
            if (result.success) {
                // Invalidate bots list
                queryClient.invalidateQueries({ queryKey: queryKeys.bots.all() });

                // Remove specific bot from cache
                queryClient.removeQueries({
                    queryKey: queryKeys.bots.detail(variables.id)
                });

                // Invalidate related data
                queryClient.invalidateQueries({ queryKey: queryKeys.signals.all() });
                queryClient.invalidateQueries({ queryKey: queryKeys.positions.all() });

                toast.success("Bot deleted successfully");
            } else {
                toast.error(result.error || "Failed to delete bot");
            }
        },
        onError: (error: Error) => {
            toast.error(error.message || "An unexpected error occurred");
        },
    });
}
