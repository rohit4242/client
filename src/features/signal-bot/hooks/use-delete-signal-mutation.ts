/**
 * useDeleteSignalMutation hook
 * 
 * Mutation hook for signal deletion.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { deleteSignal } from "../actions/delete-signal";
import type { DeleteSignalInput } from "../schemas/bot.schema";

export function useDeleteSignalMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: DeleteSignalInput) => {
            const result = await deleteSignal(input);
            if (!result.success) {
                throw new Error(result.error || "Failed to delete signal");
            }
            return result;
        },
        onSuccess: () => {
            toast.success("Signal deleted successfully");
            queryClient.invalidateQueries({ queryKey: ["signals"] });
            queryClient.invalidateQueries({ queryKey: ["signal-bots"] });
        },
        onError: (error: Error) => {
            toast.error(error.message);
        }
    });
}
