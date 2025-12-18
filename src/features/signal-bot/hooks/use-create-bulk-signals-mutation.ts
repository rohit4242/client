/**
 * useCreateBulkSignalsMutation hook
 * 
 * Mutation hook for bulk signal creation.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createBulkSignals } from "../actions/create-bulk-signals";
import type { CreateBulkSignalsInput, CreateBulkSignalsResult } from "../schemas/bot.schema";

export function useCreateBulkSignalsMutation() {
    const queryClient = useQueryClient();

    return useMutation<CreateBulkSignalsResult, Error, CreateBulkSignalsInput>({
        mutationFn: async (input) => {
            const result = await createBulkSignals(input);
            if (!result.success) {
                // If the entire action failed (e.g. Unauthorized)
                throw new Error(result.errors?.[0]?.error || "Failed to process bulk signals");
            }
            return result;
        },
        onSuccess: (data) => {
            if (data.created > 0) {
                // Invalidate signals queries to refresh the list
                queryClient.invalidateQueries({ queryKey: ["signals"] });
                queryClient.invalidateQueries({ queryKey: ["signal-bots"] });
            }
        },
        onError: (error) => {
            toast.error(error.message);
        }
    });
}
