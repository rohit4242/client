import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type ExchangeClient } from "@/features/exchange";
import { SideEffectType } from "@prisma/client";
import { toast } from "sonner";

export interface OrderRequest {
  exchange: ExchangeClient;
  order: {
    symbol: string;
    side: 'BUY' | 'SELL';
    type: 'MARKET' | 'LIMIT';
    quantity?: string;
    quoteOrderQty?: string;
    price?: string;
    timeInForce?: 'GTC' | 'IOC' | 'FOK';
    sideEffectType?: SideEffectType;
  };
  userId?: string;
  accountType?: 'spot' | 'margin';
}

export interface OrderResult {
  success: boolean;
  positionId?: string;
  orderId?: string;
  binanceOrderId?: string;
  executedQty?: number;
  executedPrice?: number;
  error?: string;
  message?: string;
  code?: number;
}

/**
 * React Query mutation hook for creating orders
 * Uses the NEW unified API endpoint: /api/trading/order
 * This endpoint calls executeOrder() from order-service.ts
 * 
 * Features:
 * - Optimistic updates for instant UI feedback
 * - Automatic cache invalidation
 * - Built-in error handling with rollback
 * - Works for both spot and margin orders
 * 
 * @returns Mutation object with mutate/mutateAsync functions
 * 
 * @example
 * const createOrder = useCreateOrderMutation();
 * 
 * await createOrder.mutateAsync({
 *   exchange,
 *   order: {
 *     symbol: 'BTCUSDT',
 *     side: 'BUY',
 *     type: 'MARKET',
 *     quantity: '0.001',
 *   },
 *   accountType: 'spot',
 * });
 */
export function useCreateOrderMutation() {
  const queryClient = useQueryClient();

  return useMutation<OrderResult, Error, OrderRequest>({
    mutationFn: async (orderData: OrderRequest) => {
      const response = await fetch('/api/trading/order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          exchange: {
            id: orderData.exchange.id,
            apiKey: orderData.exchange.apiKey,
            apiSecret: orderData.exchange.apiSecret,
            name: orderData.exchange.name,
          },
          order: {
            symbol: orderData.order.symbol,
            side: orderData.order.side,
            type: orderData.order.type,
            quantity: orderData.order.quantity,
            quoteOrderQty: orderData.order.quoteOrderQty,
            price: orderData.order.price,
            timeInForce: orderData.order.timeInForce,
            sideEffectType: orderData.order.sideEffectType,
          },
          userId: orderData.userId,
          accountType: orderData.accountType || 'spot',
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create order');
      }

      return result.data || result;
    },

    onMutate: async (newOrder) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ['positions'] });

      // Snapshot the previous value for rollback
      const previousPositions = queryClient.getQueryData(['positions']);

      // Optimistically update the positions cache
      queryClient.setQueryData(['positions'], (old: any) => {
        const newPosition = {
          id: `temp-${Date.now()}`,
          symbol: newOrder.order.symbol,
          side: newOrder.order.side === 'BUY' ? 'LONG' : 'SHORT',
          status: 'PENDING',
          accountType: (newOrder.accountType || 'spot').toUpperCase(),
          quantity: parseFloat(newOrder.order.quantity || '0'),
          entryPrice: parseFloat(newOrder.order.price || '0'),
          createdAt: new Date(),
        };

        return old ? [...old, newPosition] : [newPosition];
      });

      // Return context for rollback
      return { previousPositions };
    },

    onSuccess: (data) => {
      console.log('[Mutation] Order executed successfully:', data);

      // Invalidate and refetch all related queries
      queryClient.invalidateQueries({ queryKey: ['positions'] });
      queryClient.invalidateQueries({ queryKey: ['balance'] });
      queryClient.invalidateQueries({ queryKey: ['marginBalance'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });

      // Show success toast
      toast.success('Order executed successfully', {
        description: `${data.message || `Order placed: ${data.executedQty} @ ${data.executedPrice}`}`,
      });
    },

    onError: (error, newOrder, context) => {
      console.error('[Mutation] Order failed:', error);

      // Rollback optimistic update
      if (context && typeof context === 'object' && 'previousPositions' in context && context.previousPositions) {
        queryClient.setQueryData(['positions'], context.previousPositions);
      }

      // Show error toast
      toast.error('Order failed', {
        description: error.message || 'Failed to execute order',
      });
    },

    onSettled: () => {
      // Always refetch positions after mutation completes (success or error)
      queryClient.invalidateQueries({ queryKey: ['positions'] });
    },
  });
}

