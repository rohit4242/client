/**
 * useUpdateBotMutation Hook
 * 
 * React Query mutation hook for updating a signal bot.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/lib/query/query-keys";
import type { UpdateBotInput } from "../types/bot.types";

import { updateBot } from "../actions/update-bot";

/**
 * Update signal bot with automatic cache invalidation
 * 
 * @example
 * const updateMutation = useUpdateBotMutation();
 * 
 * const handleUpdate = (data: UpdateBotInput) => {
 *   updateMutation.mutate(data);
 * };
 */
export function useUpdateBotMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updateBot,
        onSuccess: (result, variables) => {
            if (result.success) {
                // Invalidate bots list
                queryClient.invalidateQueries({ queryKey: queryKeys.bots.list() });

                // Invalidate specific bot
                queryClient.invalidateQueries({
                    queryKey: queryKeys.bots.detail(variables.id)
                });

                toast.success("Bot updated successfully");
            } else {
                toast.error(result.error || "Failed to update bot");
            }
        },
        onError: (error: Error) => {
            toast.error(error.message || "An unexpected error occurred");
        },
    });
}
