import { useState, useEffect, useRef, useCallback } from "react";
import { Exchange } from "@/db/schema/exchange";
import { AssetData, LivePriceConfig, DEFAULT_LIVE_PRICE_CONFIG } from "@/types/trading";
import { getAsset } from "@/db/actions/assets/get-asset";
import { getPrice } from "@/db/actions/assets/get-price";

interface UseAssetDataOptions {
  livePriceConfig?: Partial<LivePriceConfig>;
}

export function useAssetData(
  symbol: string | null,
  exchange: Exchange | null,
  options: UseAssetDataOptions = {}
) {
  const config = { ...DEFAULT_LIVE_PRICE_CONFIG, ...options.livePriceConfig };
  
  // Consolidated state
  const [data, setData] = useState<AssetData>({
    balance: null,
    price: null,
    lastUpdate: null,
    isLoading: false,
    error: null,
  });
  
  // Separate loading states for granular control
  const [loadingStates, setLoadingStates] = useState({
    balance: false,
    price: false,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const mountedRef = useRef(true);

  // Optimized price fetcher with retry logic
  const fetchPrice = useCallback(async (): Promise<void> => {
    if (!symbol || !exchange || !mountedRef.current) return;

    try {
      const result = await getPrice(symbol, exchange);
      
      if (mountedRef.current && result?.price) {
        setData(prev => ({
          ...prev,
          price: result.price,
          lastUpdate: new Date(),
          error: null,
        }));
        retryCountRef.current = 0;
      }
    } catch (error) {
      console.error("Price fetch error:", error);
      
      if (mountedRef.current) {
        retryCountRef.current++;
        
        if (retryCountRef.current >= config.maxRetries) {
          setData(prev => ({
            ...prev,
            error: "Failed to fetch price after multiple attempts",
          }));
        }
      }
    }
  }, [symbol, exchange, config.maxRetries]);

  // Optimized balance fetcher
  const fetchBalance = useCallback(async (): Promise<void> => {
    if (!symbol || !exchange || !mountedRef.current) return;

    setLoadingStates(prev => ({ ...prev, balance: true }));

    try {
      const result = await getAsset(symbol, exchange);
      
      if (mountedRef.current) {
        setData(prev => ({
          ...prev,
          balance: result?.asset || null,
          error: null,
        }));
      }
    } catch (error) {
      console.error("Balance fetch error:", error);
      
      if (mountedRef.current) {
        setData(prev => ({
          ...prev,
          balance: null,
          error: "Failed to fetch balance",
        }));
      }
    } finally {
      if (mountedRef.current) {
        setLoadingStates(prev => ({ ...prev, balance: false }));
      }
    }
  }, [symbol, exchange]);

  // Manual refresh function
  const refreshData = useCallback(async (): Promise<void> => {
    if (!symbol || !exchange) return;

    setLoadingStates({ balance: true, price: true });
    
    try {
      await Promise.all([fetchBalance(), fetchPrice()]);
    } finally {
      if (mountedRef.current) {
        setLoadingStates({ balance: false, price: false });
      }
    }
  }, [fetchBalance, fetchPrice, symbol, exchange]);

  // Setup live price updates
  useEffect(() => {
    const setupLiveUpdates = async () => {
      // Clear existing interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      // Reset state when symbol/exchange changes
      if (!symbol || !exchange) {
        setData({
          balance: null,
          price: null,
          lastUpdate: null,
          isLoading: false,
          error: null,
        });
        setLoadingStates({ balance: false, price: false });
        return;
      }

      // Initial data fetch
      setData(prev => ({ ...prev, isLoading: true }));
      await refreshData();
      setData(prev => ({ ...prev, isLoading: false }));

      // Setup live price updates
      if (config.enabled && config.intervalMs > 0) {
        intervalRef.current = setInterval(fetchPrice, config.intervalMs);
      }
    };

    setupLiveUpdates();

    // Cleanup function
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [symbol, exchange, fetchPrice, refreshData, config.enabled, config.intervalMs]);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    // Data
    balance: data.balance,
    price: data.price,
    lastUpdate: data.lastUpdate,
    error: data.error,
    
    // Loading states
    isLoading: data.isLoading,
    isLoadingBalance: loadingStates.balance,
    isLoadingPrice: loadingStates.price,
    
    // Actions
    refreshData,
    refreshPrice: fetchPrice,
    refreshBalance: fetchBalance,
  };
}
