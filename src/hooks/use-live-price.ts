"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";

interface LivePriceHookResult {
  price: number | null;
  loading: boolean;
  error: string | null;
  refreshPrice: () => void;
}

export function useLivePrice(symbol: string): LivePriceHookResult {
  const [price, setPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPrice = useCallback(async () => {
    if (!symbol) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`/api/trading/price/${symbol}`);
      
      if (response.data.success && response.data.data?.price) {
        const priceValue = parseFloat(response.data.data.price);
        setPrice(priceValue);
      } else {
        setError("Failed to fetch price");
        setPrice(null);
      }
    } catch (err) {
      console.error(`Error fetching price for ${symbol}:`, err);
      setError("Failed to fetch price");
      setPrice(null);
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  const refreshPrice = useCallback(() => {
    fetchPrice();
  }, [fetchPrice]);

  useEffect(() => {
    fetchPrice();
    
    // Set up interval to refresh price every 5 seconds
    const interval = setInterval(fetchPrice, 5000);
    
    return () => clearInterval(interval);
  }, [fetchPrice]);

  return {
    price,
    loading,
    error,
    refreshPrice,
  };
}

// Hook for multiple symbols
export function useLivePrices(symbols: string[]) {
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPrices = useCallback(async () => {
    if (!symbols.length) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Fetch prices for all symbols in parallel
      const pricePromises = symbols.map(async (symbol) => {
        try {
          const response = await axios.get(`/api/trading/price/${symbol}`);
          if (response.data.success && response.data.data?.price) {
            return {
              symbol,
              price: parseFloat(response.data.data.price),
            };
          }
          return { symbol, price: null };
        } catch (err) {
          console.error(`Error fetching price for ${symbol}:`, err);
          return { symbol, price: null };
        }
      });

      const results = await Promise.all(pricePromises);
      
      const newPrices: Record<string, number> = {};
      results.forEach(({ symbol, price }) => {
        if (price !== null) {
          newPrices[symbol] = price;
        }
      });
      
      setPrices(newPrices);
    } catch (err) {
      console.error("Error fetching prices:", err);
      setError("Failed to fetch prices");
    } finally {
      setLoading(false);
    }
  }, [symbols]);

  const refreshPrices = useCallback(() => {
    fetchPrices();
  }, [fetchPrices]);

  useEffect(() => {
    fetchPrices();
    
    // Set up interval to refresh prices every 5 seconds
    const interval = setInterval(fetchPrices, 5000);
    
    return () => clearInterval(interval);
  }, [fetchPrices]);

  return {
    prices,
    loading,
    error,
    refreshPrices,
  };
}
