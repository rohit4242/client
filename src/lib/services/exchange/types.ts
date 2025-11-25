/**
 * Shared types for exchange services
 * Used by both spot and margin trading
 */

import { Exchange } from "@/types/exchange";

// Binance API configuration
export interface BinanceConfig {
  apiKey: string;
  apiSecret: string;
}

// Common order parameters
export interface BaseOrderParams {
  symbol: string;
  side: 'BUY' | 'SELL';
  type: 'MARKET' | 'LIMIT';
}

// Spot order parameters
export interface SpotOrderParams extends BaseOrderParams {
  quantity?: string;
  quoteOrderQty?: string;
  price?: string;
  timeInForce?: 'GTC' | 'IOC' | 'FOK';
}

// Margin order parameters
export interface MarginOrderParams extends BaseOrderParams {
  quantity?: string;
  quoteOrderQty?: string;
  price?: string;
  timeInForce?: 'GTC' | 'IOC' | 'FOK';
  sideEffectType?: 'NO_SIDE_EFFECT' | 'MARGIN_BUY' | 'AUTO_REPAY';
}

// Binance order response (common fields)
export interface BinanceOrderResponse {
  symbol: string;
  orderId: number;
  clientOrderId?: string;
  transactTime?: number;
  price?: string;
  origQty?: string;
  executedQty?: string;
  cummulativeQuoteQty?: string;
  status?: string;
  timeInForce?: string;
  type?: string;
  side?: string;
  fills?: Array<{
    price: string;
    qty: string;
    commission: string;
    commissionAsset: string;
  }>;
}

// Result from exchange execution
export interface ExchangeResult {
  success: boolean;
  data?: BinanceOrderResponse;
  error?: string;
  code?: number;
}

// Helper to convert Exchange type to BinanceConfig
export function toBinanceConfig(exchange: { apiKey: string; apiSecret: string }): BinanceConfig {
  return {
    apiKey: exchange.apiKey,
    apiSecret: exchange.apiSecret,
  };
}

