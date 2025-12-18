/**
 * useCreateBotMutation Hook
 * 
 * React Query mutation hook for creating a signal bot.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/lib/query/query-keys";
import { createBot } from "../actions/create-bot";
import type { CreateBotInput } from "../types/bot.types";

/**
 * Create new signal bot with automatic cache invalidation
 * 
 * @example
 * const createMutation = useCreateBotMutation();
 * 
 * const handleCreate = (data: CreateBotInput) => {
 *   createMutation.mutate(data);
 * };
 */
export function useCreateBotMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createBot,
        onSuccess: (result) => {
            if (result.success) {
                // Invalidate bots list
                queryClient.invalidateQueries({ queryKey: queryKeys.bots.all() });

                toast.success("Signal bot created successfully");
            } else {
                toast.error(result.error || "Failed to create bot");
            }
        },
        onError: (error: Error) => {
            toast.error(error.message || "An unexpected error occurred");
        },
    });
}
