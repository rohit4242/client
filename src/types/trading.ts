// Trading-specific types for better type safety and performance

export interface AssetBalance {
  asset: string;
  free: string;
  locked: string;
}

export interface AssetPrice {
  symbol: string;
  price: string;
}

export interface AssetData {
  balance: AssetBalance | null;
  price: AssetPrice | null;
  lastUpdate: Date | null;
  isLoading: boolean;
  error: string | null;
}

export interface LivePriceConfig {
  intervalMs: number;
  enabled: boolean;
  maxRetries: number;
}

export const DEFAULT_LIVE_PRICE_CONFIG: LivePriceConfig = {
  intervalMs: 1000,
  enabled: true,
  maxRetries: 3,
};
