import { useState, useEffect, useCallback, useRef } from "react";
import { type ExchangeClient } from "@/features/exchange";

interface MarginAssetBalance {
  asset: string;
  free: string;
  locked: string;
  borrowed: string;
  interest: string;
  netAsset: string;
}

interface MarginBalanceData {
  balance: MarginAssetBalance | null;
  isLoading: boolean;
  error: string | null;
  lastUpdate: Date | null;
}

/**
 * Hook to fetch margin account balance for a specific asset
 * Returns margin-specific balance info including borrowed amounts
 */
export function useMarginBalance(
  asset: string | null,
  exchange: ExchangeClient | null
): MarginBalanceData {
  const [data, setData] = useState<MarginBalanceData>({
    balance: null,
    isLoading: false,
    error: null,
    lastUpdate: null,
  });

  const mountedRef = useRef(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchMarginBalance = useCallback(async () => {
    if (!asset || !exchange || !mountedRef.current) return;

    setData(prev => ({ ...prev, isLoading: true }));

    try {
      const response = await fetch('/api/margin/account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey: exchange.apiKey,
          apiSecret: exchange.apiSecret,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch margin account');
      }

      const result = await response.json();

      if (mountedRef.current && result.success) {
        // Find the specific asset in the margin account
        const assetData = result.data.userAssets?.find(
          (a: any) => a.asset === asset
        );

        if (assetData) {
          setData({
            balance: {
              asset: assetData.asset,
              free: assetData.free || '0',
              locked: assetData.locked || '0',
              borrowed: assetData.borrowed || '0',
              interest: assetData.interest || '0',
              netAsset: assetData.netAsset || '0',
            },
            isLoading: false,
            error: null,
            lastUpdate: new Date(),
          });
        } else {
          // Asset not found in margin account, return zero balances
          setData({
            balance: {
              asset: asset,
              free: '0',
              locked: '0',
              borrowed: '0',
              interest: '0',
              netAsset: '0',
            },
            isLoading: false,
            error: null,
            lastUpdate: new Date(),
          });
        }
      }
    } catch (error) {
      console.error('Error fetching margin balance:', error);

      if (mountedRef.current) {
        setData({
          balance: null,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to fetch margin balance',
          lastUpdate: null,
        });
      }
    }
  }, [asset, exchange]);

  // Fetch balance on mount and when asset/exchange changes
  useEffect(() => {
    fetchMarginBalance();

    // Set up auto-refresh every 10 seconds
    intervalRef.current = setInterval(fetchMarginBalance, 10000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchMarginBalance]);

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

  return data;
}

