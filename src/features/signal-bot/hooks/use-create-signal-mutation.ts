/**
 * useCreateSignalMutation hook
 * 
 * Mutation hook for manual signal creation.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createSignal } from "../actions/create-signal";
import type { CreateSignalInput } from "../schemas/bot.schema";

export function useCreateSignalMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: CreateSignalInput) => {
            const result = await createSignal(input);
            if (!result.success) {
                throw new Error(result.error || "Failed to create signal");
            }
            return result;
        },
        onSuccess: () => {
            toast.success("Signal created successfully");
            queryClient.invalidateQueries({ queryKey: ["signals"] });
            queryClient.invalidateQueries({ queryKey: ["signal-bots"] });
        },
        onError: (error: Error) => {
            toast.error(error.message);
        }
    });
}
