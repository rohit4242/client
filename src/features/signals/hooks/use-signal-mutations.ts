"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateSignal } from "../actions/update-signal";
import { deleteSignal } from "../actions/delete-signal";
import { createSignal } from "../actions/create-signal";
import { bulkCreateSignals } from "../actions/bulk-create-signals";
import { bulkUpdateVisibility, bulkUpdateProcessedStatus } from "../actions/bulk-actions";
import { toast } from "sonner";

/**
 * Mutation for updating a single signal
 */
export function useUpdateSignalMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updateSignal,
        onSuccess: (data) => {
            if (data.success) {
                toast.success("Signal updated successfully");
                queryClient.invalidateQueries({ queryKey: ["admin-signals"] });
                queryClient.invalidateQueries({ queryKey: ["user-signals"] });
            } else {
                toast.error(data.error || "Failed to update signal");
            }
        },
        onError: (error) => {
            toast.error(error instanceof Error ? error.message : "An error occurred");
        },
    });
}

/**
 * Mutation for deleting a single signal
 */
export function useDeleteSignalMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteSignal,
        onSuccess: (data) => {
            if (data.success) {
                toast.success("Signal deleted successfully");
                queryClient.invalidateQueries({ queryKey: ["admin-signals"] });
                queryClient.invalidateQueries({ queryKey: ["user-signals"] });
            } else {
                toast.error(data.error || "Failed to delete signal");
            }
        },
        onError: (error) => {
            toast.error(error instanceof Error ? error.message : "An error occurred");
        },
    });
}

/**
 * Mutation for bulk updating visibility
 */
export function useBulkUpdateVisibilityMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ ids, visible }: { ids: string[]; visible: boolean }) =>
            bulkUpdateVisibility(ids, visible),
        onSuccess: (data) => {
            if (data.success) {
                toast.success("Updated signal visibility");
                queryClient.invalidateQueries({ queryKey: ["admin-signals"] });
                queryClient.invalidateQueries({ queryKey: ["user-signals"] });
            } else {
                toast.error(data.error || "Failed to update signals");
            }
        },
    });
}

/**
 * Mutation for bulk updating processed status
 */
export function useBulkUpdateProcessedStatusMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ ids, processed }: { ids: string[]; processed: boolean }) =>
            bulkUpdateProcessedStatus(ids, processed),
        onSuccess: (data) => {
            if (data.success) {
                toast.success("Updated signal status");
                queryClient.invalidateQueries({ queryKey: ["admin-signals"] });
                queryClient.invalidateQueries({ queryKey: ["user-signals"] });
            } else {
                toast.error(data.error || "Failed to update signals");
            }
        },
    });
}

/**
 * Mutation for creating a new signal
 */
export function useCreateSignalMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createSignal,
        onSuccess: (data) => {
            if (data.success) {
                toast.success("Signal created successfully");
                queryClient.invalidateQueries({ queryKey: ["admin-signals"] });
                queryClient.invalidateQueries({ queryKey: ["user-signals"] });
            } else {
                toast.error(data.error || "Failed to create signal");
            }
        },
        onError: (error) => {
            toast.error(error instanceof Error ? error.message : "An error occurred");
        },
    });
}

/**
 * Mutation for bulk creating signals
 */
export function useBulkCreateSignalsMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: bulkCreateSignals,
        onSuccess: (data) => {
            if (data.success) {
                queryClient.invalidateQueries({ queryKey: ["admin-signals"] });
                queryClient.invalidateQueries({ queryKey: ["user-signals"] });
            } else {
                toast.error(data.error || "Failed to bulk create signals");
            }
        },
        onError: (error) => {
            toast.error(error instanceof Error ? error.message : "An error occurred");
        },
    });
}
