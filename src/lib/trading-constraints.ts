import { SpotRestAPI } from "@binance/spot";

// Types for trading constraints
export interface TradingConstraints {
  minQty: number;
  maxQty: number;
  stepSize: number;
  minPrice: number;
  maxPrice: number;
  tickSize: number;
  minNotional: number;
  maxNotional?: number;
}

export interface MaxBuyInfo {
  maxByTotal: number;
  maxByAmount: number;
  currency: string;
}

// Extract trading constraints from exchange info
export function extractTradingConstraints(
  exchangeInfo: SpotRestAPI.ExchangeInfoResponse | null,
  symbol: string
): TradingConstraints | null {
  if (!exchangeInfo?.symbols) return null;

  const symbolInfo = exchangeInfo.symbols.find(s => s.symbol === symbol);
  if (!symbolInfo?.filters) return null;

  const constraints: Partial<TradingConstraints> = {};

  symbolInfo.filters.forEach(filter => {
    switch (filter.filterType) {
      case "LOT_SIZE":
        constraints.minQty = parseFloat(filter.minQty || "0");
        constraints.maxQty = parseFloat(filter.maxQty || "0");
        constraints.stepSize = parseFloat(filter.stepSize || "0");
        break;
      case "PRICE_FILTER":
        constraints.minPrice = parseFloat(filter.minPrice || "0");
        constraints.maxPrice = parseFloat(filter.maxPrice || "0");
        constraints.tickSize = parseFloat(filter.tickSize || "0");
        break;
      case "NOTIONAL":
        constraints.minNotional = parseFloat(filter.minNotional || "0");
        if (filter.maxNotional) {
          constraints.maxNotional = parseFloat(filter.maxNotional);
        }
        break;
      case "MIN_NOTIONAL":
        constraints.minNotional = parseFloat(filter.minNotional || "0");
        break;
    }
  });

  // Return only if we have the essential constraints
  if (constraints.minQty !== undefined && constraints.stepSize !== undefined && constraints.minNotional !== undefined) {
    return constraints as TradingConstraints;
  }

  return null;
}

// Calculate maximum buy amounts based on available balance and constraints
export function calculateMaxBuy(
  quoteBalance: number, // Available USDT balance
  baseBalance: number,  // Available BTC balance
  currentPrice: number,
  constraints: TradingConstraints | null,
  baseAsset: string,
  quoteAsset: string
): MaxBuyInfo {
  if (!constraints || currentPrice <= 0) {
    return {
      maxByTotal: quoteBalance,
      maxByAmount: baseBalance,
      currency: quoteAsset,
    };
  }

  // Max buy by total (USDT) - limited by available quote balance and max notional
  let maxByTotal = quoteBalance;
  if (constraints.maxNotional && constraints.maxNotional > 0) {
    maxByTotal = Math.min(maxByTotal, constraints.maxNotional);
  }

  // Max buy by amount (BTC) - limited by available quote balance and max quantity
  let maxByAmount = Math.min(
    quoteBalance / currentPrice, // How much we can afford
    constraints.maxQty || Number.MAX_SAFE_INTEGER // Exchange limit
  );

  // Apply step size rounding for amount
  if (constraints.stepSize > 0) {
    maxByAmount = Math.floor(maxByAmount / constraints.stepSize) * constraints.stepSize;
  }

  return {
    maxByTotal: Number(maxByTotal.toFixed(8)),
    maxByAmount: Number(maxByAmount.toFixed(8)),
    currency: quoteAsset,
  };
}

// Validate if a quantity meets step size requirements
export function validateStepSize(quantity: number, stepSize: number): number {
  if (stepSize <= 0) return quantity;
  return Math.floor(quantity / stepSize) * stepSize;
}

// Validate if an order meets minimum notional requirements
export function validateMinNotional(
  quantity: number,
  price: number,
  minNotional: number
): boolean {
  const notional = quantity * price;
  return notional >= minNotional;
}

// Format number according to step size precision
export function formatToStepSize(value: number, stepSize: number): string {
  if (stepSize <= 0) return value.toFixed(8);
  
  // Calculate decimal places based on step size
  const stepStr = stepSize.toString();
  const decimalPlaces = stepStr.includes('.') 
    ? stepStr.split('.')[1].length 
    : 0;
    
  return value.toFixed(decimalPlaces);
}

// Get user-friendly constraint messages
export function getConstraintMessages(
  constraints: TradingConstraints | null,
  baseAsset: string,
  quoteAsset: string
): {
  minQuantity: string;
  stepSize: string;
  minOrder: string;
} {
  if (!constraints) {
    return {
      minQuantity: `Min: 0 ${baseAsset}`,
      stepSize: `Step: Any`,
      minOrder: `Min Order: 0 ${quoteAsset}`,
    };
  }

  return {
    minQuantity: `Min: ${formatToStepSize(constraints.minQty, constraints.stepSize)} ${baseAsset}`,
    stepSize: `Step: ${formatToStepSize(constraints.stepSize, constraints.stepSize)} ${baseAsset}`,
    minOrder: `Min Order: ${constraints.minNotional.toFixed(2)} ${quoteAsset}`,
  };
}
