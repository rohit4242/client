/**
 * useCreatePositionMutation hook
 * 
 * Mutation hook for manual position creation.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createPosition } from "../actions/create-position";
import type { CreatePositionInput, CreatePositionResult } from "../schemas/bot.schema";

export function useCreatePositionMutation() {
    const queryClient = useQueryClient();

    return useMutation<CreatePositionResult, Error, CreatePositionInput>({
        mutationFn: async (input) => {
            const result = await createPosition(input);
            if (!result.success) {
                throw new Error(result.error || "Failed to create position");
            }
            return result;
        },
        onSuccess: (data) => {
            toast.success(data.message || "Position created successfully");
            // Invalidate relevant queries
            queryClient.invalidateQueries({ queryKey: ["positions"] });
            queryClient.invalidateQueries({ queryKey: ["signals"] });
            queryClient.invalidateQueries({ queryKey: ["bots-stats"] });
        },
        onError: (error) => {
            toast.error(error.message);
        }
    });
}
