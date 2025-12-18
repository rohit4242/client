/**
 * useUpdateSignalMutation Hook
 * 
 * React Query mutation hook for updating a signal.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/lib/query/query-keys";
import { updateSignal, type UpdateSignalInput } from "../actions/update-signal";

/**
 * Update signal with automatic cache invalidation
 * 
 * @example
 * const updateMutation = useUpdateSignalMutation();
 * 
 * const handleUpdate = (data: UpdateSignalInput) => {
 *   updateMutation.mutate(data);
 * };
 */
export function useUpdateSignalMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updateSignal,
        onSuccess: (result, variables) => {
            if (result.success) {
                // Invalidate signals list
                queryClient.invalidateQueries({ queryKey: queryKeys.signals.all() });

                toast.success("Signal updated successfully");
            } else {
                toast.error(result.error || "Failed to update signal");
            }
        },
        onError: (error: Error) => {
            toast.error(error.message || "An unexpected error occurred");
        },
    });
}
