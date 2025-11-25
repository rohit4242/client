import { useEffect } from "react";
import { usePriceContext } from "@/providers/price-provider";

interface UseLivePriceReturn {
  price: string | null;
  timestamp: number | null;
  isConnected: boolean;
  error: string | null;
}

/**
 * Hook to get live price for a symbol from global WebSocket connection
 * No API calls - just subscribes to WebSocket updates
 * 
 * @param symbol - Trading symbol (e.g., 'BTCUSDT')
 * @returns Price data and connection status
 * 
 * @example
 * const { price, isConnected } = useLivePriceQuery('BTCUSDT');
 */
export function useLivePriceQuery(symbol: string | null): UseLivePriceReturn {
  const { prices, isConnected, error, subscribeToSymbols, unsubscribeFromSymbols } = usePriceContext();

  // Subscribe/unsubscribe when symbol changes
  useEffect(() => {
    if (!symbol) return;

    const normalizedSymbol = symbol.toUpperCase();
    subscribeToSymbols([normalizedSymbol]);

    return () => {
      unsubscribeFromSymbols([normalizedSymbol]);
    };
  }, [symbol, subscribeToSymbols, unsubscribeFromSymbols]);

  if (!symbol) {
    return {
      price: null,
      timestamp: null,
      isConnected,
      error,
    };
  }

  const normalizedSymbol = symbol.toUpperCase();
  const priceData = prices[normalizedSymbol];

  return {
    price: priceData?.price || null,
    timestamp: priceData?.timestamp || null,
    isConnected,
    error,
  };
}

