/**
 * useToggleBotMutation Hook
 * 
 * React Query mutation hook for toggling bot active status.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/lib/query/query-keys";
import type { ToggleBotInput } from "../types/bot.types";

import { toggleBot } from "../actions/toggle-bot";

/**
 * Toggle bot active status
 * 
 * @example
 * const toggleMutation = useToggleBotMutation();
 * 
 * const handleToggle = (id: string, isActive: boolean) => {
 *   toggleMutation.mutate({ id, isActive });
 * };
 */
export function useToggleBotMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: toggleBot,
        onSuccess: (result, variables) => {
            if (result.success) {
                // Invalidate bots queries
                queryClient.invalidateQueries({ queryKey: queryKeys.bots.all() });

                const status = variables.isActive ? "activated" : "deactivated";
                toast.success(`Bot ${status} successfully`);
            } else {
                toast.error(result.error || "Failed to toggle bot");
            }
        },
        onError: (error: Error) => {
            toast.error(error.message || "An unexpected error occurred");
        },
    });
}
