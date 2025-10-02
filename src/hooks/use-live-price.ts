"use client";

import { useCryptoPrice } from "./use-crypto-price";

interface LivePriceHookResult {
  price: number | null;
  isUpdating: boolean;
  error: string | null;
  refreshPrice: () => void;
  userId?: string;
}

/**
 * Hook for getting live price of a single symbol using WebSocket
 * @param symbol - Trading pair symbol (e.g., 'BTCUSDT')
 * @param userId - Optional user ID (kept for backward compatibility, not used)
 */
export function useLivePrice(symbol: string, userId?: string): LivePriceHookResult {
  const { prices, isConnected, error } = useCryptoPrice(symbol ? [symbol] : []);
  
  const priceData = prices[symbol];
  const price = priceData ? parseFloat(priceData.price) : null;

  // Dummy refresh function for backward compatibility
  const refreshPrice = () => {
    // WebSocket automatically refreshes, no manual refresh needed
  };

  return {
    price,
    isUpdating: !isConnected && !price, // Consider updating if not connected and no price yet
    error: error,
    refreshPrice,
    userId,
  };
}

/**
 * Hook for getting live prices of multiple symbols using WebSocket
 * @param symbols - Array of trading pair symbols (e.g., ['BTCUSDT', 'ETHUSDT'])
 * @param userId - Optional user ID (kept for backward compatibility, not used)
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function useLivePrices(symbols: string[], userId?: string) {
  const { prices: wsData, isConnected, error } = useCryptoPrice(symbols);
  
  // Convert WebSocket price data to the expected format
  const prices: Record<string, number> = {};
  Object.keys(wsData).forEach((symbol) => {
    const priceStr = wsData[symbol]?.price;
    if (priceStr) {
      const priceNum = parseFloat(priceStr);
      if (!isNaN(priceNum)) {
        prices[symbol] = priceNum;
      }
    }
  });

  // Dummy refresh function for backward compatibility
  const refreshPrices = () => {
    // WebSocket automatically refreshes, no manual refresh needed
  };

  return {
    prices,
    isUpdating: !isConnected && Object.keys(prices).length === 0,
    error: error,
    refreshPrices,
  };
}
