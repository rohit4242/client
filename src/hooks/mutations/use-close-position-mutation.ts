import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export interface ClosePositionRequest {
  positionId: string;
}

export interface ClosePositionResult {
  success: boolean;
  message?: string;
  closedPosition?: any;
  error?: string;
}

/**
 * React Query mutation hook for closing positions
 * Handles optimistic updates and cache invalidation
 * 
 * @returns Mutation object with mutate/mutateAsync functions
 * 
 * @example
 * const closePosition = useClosePositionMutation();
 * 
 * await closePosition.mutateAsync({
 *   positionId: 'position-123',
 * });
 */
export function useClosePositionMutation() {
  const queryClient = useQueryClient();

  return useMutation<ClosePositionResult, Error, ClosePositionRequest>({
    mutationFn: async (data: ClosePositionRequest) => {
      const response = await fetch(`/api/positions/${data.positionId}/close`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to close position');
      }

      return result;
    },

    onMutate: async (data) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['positions'] });

      // Snapshot the previous value
      const previousPositions = queryClient.getQueryData(['positions']);

      // Optimistically update to show position as closing
      queryClient.setQueryData(['positions'], (old: any) => {
        if (!old) return old;

        return old.map((pos: any) =>
          pos.id === data.positionId
            ? { ...pos, status: 'CLOSING' }
            : pos
        );
      });

      return { previousPositions };
    },

    onSuccess: (data) => {
      console.log('[Mutation] Position closed successfully:', data);

      // Invalidate and refetch all related queries
      queryClient.invalidateQueries({ queryKey: ['positions'] });
      queryClient.invalidateQueries({ queryKey: ['balance'] });
      queryClient.invalidateQueries({ queryKey: ['marginBalance'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });

      // Show success toast
      toast.success('Position closed successfully', {
        description: data.message || 'Your position has been closed',
      });
    },

    onError: (error, data, context) => {
      console.error('[Mutation] Close position failed:', error);

      // Rollback optimistic update
      if (context && typeof context === 'object' && 'previousPositions' in context && context.previousPositions) {
        queryClient.setQueryData(['positions'], context.previousPositions);
      }

      // Show error toast
      toast.error('Failed to close position', {
        description: error.message || 'An error occurred while closing the position',
      });
    },

    onSettled: () => {
      // Always refetch positions after mutation completes
      queryClient.invalidateQueries({ queryKey: ['positions'] });
    },
  });
}

