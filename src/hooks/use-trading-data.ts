import { useLivePriceQuery } from "@/hooks/use-live-price-query";
import { useBalanceQuery } from "@/hooks/queries/use-balance-query";
import { useMarginBalanceQuery, MarginAssetBalance } from "@/hooks/queries/use-margin-balance-query";
import { useSymbolInfoQuery } from "@/hooks/queries/use-symbol-info-query";
import { Exchange, type ExchangeClient } from "@/features/exchange";
import { AssetBalance } from "@/types/trading";
import { extractBaseAsset } from "@/lib/utils";
import { useMemo } from "react";
import { SpotRestAPI } from "@binance/spot";

interface UseTradingDataOptions {
  /**
   * Account type: 'spot' or 'margin'
   * Determines which balance queries to use
   */
  accountType?: 'spot' | 'margin';
}

interface TradingDataReturn {
  // Price data
  price: {
    symbol: string;
    price: string;
    timestamp: number;
  } | null;
  isConnected: boolean;

  // Balance data
  baseBalance: AssetBalance | MarginAssetBalance | null;
  quoteBalance: AssetBalance | MarginAssetBalance | null;
  isLoadingBalance: boolean;

  // Symbol info
  symbolInfo: SpotRestAPI.ExchangeInfoResponse | null;
  isLoadingSymbolInfo: boolean;

  // Assets
  baseAsset: string;
  quoteAsset: string;
}

/**
 * Unified hook that combines all trading data needs
 * Uses WebSocket for prices and React Query for balances and symbol info
 * 
 * Benefits:
 * - Single hook instead of 4+ separate calls
 * - Smart caching for balances and symbol info
 * - Real-time price updates via WebSocket
 * - Automatic type handling for spot/margin
 * 
 * @param symbol - Trading symbol (e.g., 'BTCUSDT')
 * @param exchange - Exchange configuration
 * @param options - Configuration options
 * @returns Combined trading data
 * 
 * @example
 * // Spot trading
 * const { price, baseBalance, quoteBalance, symbolInfo } = useTradingData(
 *   'BTCUSDT',
 *   exchange,
 *   { accountType: 'spot' }
 * );
 * 
 * @example
 * // Margin trading
 * const { price, baseBalance, quoteBalance } = useTradingData(
 *   'BTCUSDT',
 *   exchange,
 *   { accountType: 'margin' }
 * );
 */
export function useTradingData(
  symbol: string | null,
  exchange: ExchangeClient | null,
  options?: UseTradingDataOptions
): TradingDataReturn {
  const accountType = options?.accountType || 'spot';

  // Extract base and quote assets
  const baseAsset = symbol ? extractBaseAsset(symbol) : '';
  const quoteAsset = symbol && baseAsset ? symbol.replace(baseAsset, '') : '';

  // WebSocket price (real-time, no polling!)
  const { price: livePrice, isConnected, timestamp } = useLivePriceQuery(symbol);

  // Convert to expected format
  const price = useMemo(() => {
    if (!livePrice || !symbol) return null;
    return {
      symbol,
      price: livePrice,
      timestamp: timestamp || Date.now()
    };
  }, [livePrice, symbol, timestamp]);

  // Conditional balance queries based on account type
  const spotBaseBalance = useBalanceQuery(
    baseAsset,
    exchange,
    { enabled: accountType === 'spot' }
  );

  const spotQuoteBalance = useBalanceQuery(
    quoteAsset,
    exchange,
    { enabled: accountType === 'spot' }
  );

  const marginBaseBalance = useMarginBalanceQuery(
    baseAsset,
    exchange,
    { enabled: accountType === 'margin' }
  );

  const marginQuoteBalance = useMarginBalanceQuery(
    quoteAsset,
    exchange,
    { enabled: accountType === 'margin' }
  );

  // Helper to safely extract single balance
  const getSingleBalance = <T extends { asset: string }>(
    data: T | T[] | null | undefined,
    targetAsset: string
  ): T | null => {
    if (!data) return null;
    if (Array.isArray(data)) {
      return data.find((item) => item.asset === targetAsset) || null;
    }
    return data;
  };

  // Select the appropriate balances based on account type
  const baseBalance = accountType === 'spot'
    ? getSingleBalance(spotBaseBalance.data, baseAsset)
    : getSingleBalance(marginBaseBalance.data, baseAsset);

  const quoteBalance = accountType === 'spot'
    ? getSingleBalance(spotQuoteBalance.data, quoteAsset)
    : getSingleBalance(marginQuoteBalance.data, quoteAsset);

  const isLoadingBalance = accountType === 'spot'
    ? spotBaseBalance.isLoading || spotQuoteBalance.isLoading
    : marginBaseBalance.isLoading || marginQuoteBalance.isLoading;

  // Symbol info (long cache - 5 minutes)
  const { data: symbolInfo, isLoading: isLoadingSymbolInfo } = useSymbolInfoQuery(
    symbol,
    exchange
  );

  return {
    price,
    isConnected,
    baseBalance,
    quoteBalance,
    isLoadingBalance,
    symbolInfo: symbolInfo || null,
    isLoadingSymbolInfo,
    baseAsset,
    quoteAsset,
  };
}

