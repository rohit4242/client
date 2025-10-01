"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";

interface LivePriceHookResult {
  price: number | null;
  isUpdating: boolean;
  error: string | null;
  refreshPrice: () => void;
}

export function useLivePrice(symbol: string): LivePriceHookResult {
  const [price, setPrice] = useState<number | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialLoad = useRef(true);

  const fetchPrice = useCallback(async () => {
    if (!symbol) {
      return;
    }

    try {
      // Only show updating state after initial load
      if (!isInitialLoad.current) {
        setIsUpdating(true);
      }
      setError(null);
      
      const response = await axios.get(`/api/trading/price/${symbol}`);
      
      let priceValue: number | null = null;
      
      // Handle different response formats
      if (response.data?.price) {
        priceValue = parseFloat(response.data.price);
      } else if (response.data?.data?.price) {
        priceValue = parseFloat(response.data.data.price);
      } else if (typeof response.data === 'number') {
        priceValue = response.data;
      }
      
      if (priceValue && !isNaN(priceValue)) {
        setPrice(priceValue);
      } else {
        console.warn(`Invalid price data for ${symbol}:`, response.data);
        // Keep the previous price if new data is invalid
      }
      
      isInitialLoad.current = false;
    } catch (err) {
      console.error(`Error fetching price for ${symbol}:`, err);
      setError("Failed to fetch price");
      // Don't clear price on error, keep showing last known price
    } finally {
      setIsUpdating(false);
    }
  }, [symbol]);

  const refreshPrice = useCallback(() => {
    fetchPrice();
  }, [fetchPrice]);

  useEffect(() => {
    if (!symbol) return;
    
    // Clear previous data when symbol changes
    setPrice(null);
    setError(null);
    isInitialLoad.current = true;
    
    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    // Fetch initial price
    fetchPrice();
    
    // Set up interval to refresh price every 3 seconds
    intervalRef.current = setInterval(fetchPrice, 1000);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchPrice]);

  return {
    price,
    isUpdating,
    error,
    refreshPrice,
  };
}

// Hook for multiple symbols
export function useLivePrices(symbols: string[]) {
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialLoad = useRef(true);

  const fetchPrices = useCallback(async () => {
    if (!symbols.length) {
      return;
    }

    try {
      // Only show updating state after initial load
      if (!isInitialLoad.current) {
        setIsUpdating(true);
      }
      setError(null);
      
      // Fetch prices for all symbols in parallel
      const pricePromises = symbols.map(async (symbol) => {
        try {
          const response = await axios.get(`/api/trading/price/${symbol}`);
          
          let priceValue: number | null = null;
          
          // Handle different response formats
          if (response.data?.price) {
            priceValue = parseFloat(response.data.price);
          } else if (response.data?.data?.price) {
            priceValue = parseFloat(response.data.data.price);
          } else if (typeof response.data === 'number') {
            priceValue = response.data;
          }
          
          return {
            symbol,
            price: priceValue && !isNaN(priceValue) ? priceValue : null,
          };
        } catch (err) {
          console.error(`Error fetching price for ${symbol}:`, err);
          return { symbol, price: null };
        }
      });

      const results = await Promise.all(pricePromises);
      
      // Update prices, keeping existing ones if new fetch fails
      setPrices(prevPrices => {
        const newPrices = { ...prevPrices };
        results.forEach(({ symbol, price }) => {
          if (price !== null) {
            newPrices[symbol] = price;
          }
          // Keep existing price if new price is null/invalid
        });
        return newPrices;
      });
      
      isInitialLoad.current = false;
    } catch (err) {
      console.error("Error fetching prices:", err);
      setError("Failed to fetch prices");
    } finally {
      setIsUpdating(false);
    }
  }, [symbols.join(',')]); // Use symbols.join(',') to create a stable dependency

  const refreshPrices = useCallback(() => {
    fetchPrices();
  }, [fetchPrices]);

  useEffect(() => {
    if (!symbols.length) return;
    
    // Clear previous data when symbols change
    setPrices({});
    setError(null);
    isInitialLoad.current = true;
    
    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    // Fetch initial prices
    fetchPrices();
    
    // Set up interval to refresh prices every 3 seconds
    intervalRef.current = setInterval(fetchPrices, 1000);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchPrices]);

  return {
    prices,
    isUpdating,
    error,
    refreshPrices,
  };
}
