import { useState, useEffect, useCallback } from "react";
import { type ExchangeClient } from "@/features/exchange";
import { AssetBalance } from "@/types/trading";
import { getAsset } from "@/db/actions/assets/get-asset";
import { extractBaseAsset, extractQuoteAsset } from "@/lib/utils";

interface UseTradingBalanceProps {
  symbol: string;
  side: "BUY" | "SELL";
  exchange: ExchangeClient | null;
}

export function useTradingBalance({ symbol, side, exchange }: UseTradingBalanceProps) {
  const [balance, setBalance] = useState<AssetBalance | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = useCallback(async () => {
    if (!symbol || !exchange) {
      setBalance(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // For BUY orders, we need the quote asset balance (e.g., USDT for BTCUSDT)
      // For SELL orders, we need the base asset balance (e.g., BTC for BTCUSDT)
      const assetToFetch = side === "BUY" ? extractQuoteAsset(symbol) : extractBaseAsset(symbol);

      // Create a symbol that represents the asset we want to check balance for
      const balanceSymbol = assetToFetch === "USDT" ? "USDTUSDT" : `${assetToFetch}USDT`;

      const result = await getAsset(balanceSymbol, exchange);

      if (result?.asset) {
        setBalance(result.asset);
      } else {
        // If we can't find the specific asset, try to get it directly
        const directResult = await getAsset(symbol, exchange);
        setBalance(directResult?.asset || null);
      }
    } catch (err) {
      console.error("Error fetching trading balance:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch balance");
      setBalance(null);
    } finally {
      setIsLoading(false);
    }
  }, [symbol, side, exchange]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  return {
    balance,
    isLoading,
    error,
    refreshBalance: fetchBalance,
  };
}
