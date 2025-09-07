import { useState, useMemo, useEffect } from "react";
import { AssetBalance, AssetPrice } from "@/types/trading";
import { ValidationWarning } from "@/app/(main)/manual-trading/_components/validation-warnings";
import { SpotRestAPI } from "@binance/spot";

interface SymbolFilter {
  filterType?: string;
  minQty?: string;
  maxQty?: string;
  stepSize?: string;
  minPrice?: string;
  maxPrice?: string;
  tickSize?: string;
  minNotional?: string;
  maxNotional?: string;
}

export interface TradingCalculations {
  estimatedCost: number;
  estimatedQuantity: number;
  estimatedTotal: number;
  fees: number;
  minOrderValue: number;
  maxOrderValue: number;
  availableBalance: number;
  warnings: ValidationWarning[];
}

interface UseTradingCalculationsProps {
  symbol: string;
  side: "BUY" | "SELL";
  orderType: "LIMIT" | "MARKET" | "STOP_LIMIT";
  price?: string;
  quantity?: string;
  percentage?: number;
  balance: AssetBalance | null;
  marketPrice: AssetPrice | null;
  symbolInfo?: SpotRestAPI.ExchangeInfoResponse | null;
}

export function useTradingCalculations({
  symbol,
  side,
  orderType,
  price,
  quantity,
  percentage,
  balance,
  marketPrice,
  symbolInfo,
}: UseTradingCalculationsProps): TradingCalculations {
  const [calculations, setCalculations] = useState<TradingCalculations>({
    estimatedCost: 0,
    estimatedQuantity: 0,
    estimatedTotal: 0,
    fees: 0,
    minOrderValue: 0,
    maxOrderValue: 0,
    availableBalance: 0,
    warnings: [],
  });

  // Extract symbol filters from exchange info
  const symbolFilters = useMemo(() => {
    if (!symbolInfo?.symbols?.length) return null;
    
    const symbolData = symbolInfo.symbols.find((s) => s.symbol === symbol);
    if (!symbolData) return null;

    const filters: Record<string, SymbolFilter> = {};
    symbolData.filters?.forEach((filter) => {
      if (filter.filterType) {
        filters[filter.filterType] = filter;
      }
    });

    return {
      minQty: parseFloat(filters.LOT_SIZE?.minQty || "0"),
      maxQty: parseFloat(filters.LOT_SIZE?.maxQty || "0"),
      stepSize: parseFloat(filters.LOT_SIZE?.stepSize || "0"),
      minPrice: parseFloat(filters.PRICE_FILTER?.minPrice || "0"),
      maxPrice: parseFloat(filters.PRICE_FILTER?.maxPrice || "0"),
      tickSize: parseFloat(filters.PRICE_FILTER?.tickSize || "0"),
      minNotional: parseFloat(filters.MIN_NOTIONAL?.minNotional || "0"),
      maxNotional: parseFloat(filters.MAX_NOTIONAL?.maxNotional || "0"),
    };
  }, [symbolInfo, symbol]);

  useEffect(() => {
    const calculateTradingMetrics = () => {
      const warnings: ValidationWarning[] = [];
      const priceValue = parseFloat(price || "0");
      const quantityValue = parseFloat(quantity || "0");
      const currentPrice = parseFloat(marketPrice?.price || "0");
      const availableBalance = parseFloat(balance?.free || "0");
      
      // Use market price for market orders, specified price for limit orders
      const effectivePrice = orderType === "MARKET" ? currentPrice : priceValue;
      
      let estimatedQuantity = quantityValue;
      let estimatedCost = 0;
      let estimatedTotal = 0;

      // Calculate based on percentage if provided
      if (percentage && percentage > 0 && availableBalance > 0) {
        const percentageAmount = (availableBalance * percentage) / 100;
        
        if (side === "BUY" && effectivePrice > 0) {
          estimatedQuantity = percentageAmount / effectivePrice;
          estimatedCost = percentageAmount;
        } else if (side === "SELL") {
          estimatedQuantity = percentageAmount;
          estimatedCost = percentageAmount * effectivePrice;
        }
      } else if (quantityValue > 0 && effectivePrice > 0) {
        // Calculate based on quantity
        if (side === "BUY") {
          estimatedCost = quantityValue * effectivePrice;
        } else {
          estimatedCost = quantityValue * effectivePrice;
        }
        estimatedQuantity = quantityValue;
      }

      // Calculate fees (assuming 0.1% trading fee)
      const feeRate = 0.001;
      const fees = estimatedCost * feeRate;
      estimatedTotal = estimatedCost + fees;

      // Validation checks
      if (symbolFilters) {
        // Check minimum quantity
        if (estimatedQuantity > 0 && estimatedQuantity < symbolFilters.minQty) {
          warnings.push({
            type: "error",
            message: `Minimum quantity is ${symbolFilters.minQty}`,
            field: "quantity",
          });
        }

        // Check maximum quantity
        if (estimatedQuantity > symbolFilters.maxQty) {
          warnings.push({
            type: "error",
            message: `Maximum quantity is ${symbolFilters.maxQty}`,
            field: "quantity",
          });
        }

        // Check minimum notional value
        if (estimatedCost > 0 && estimatedCost < symbolFilters.minNotional) {
          warnings.push({
            type: "error",
            message: `Total order value should be more than ${symbolFilters.minNotional} USDT`,
            field: "total",
          });
        }

        // Check price filters for limit orders
        if (orderType === "LIMIT" && priceValue > 0) {
          if (priceValue < symbolFilters.minPrice) {
            warnings.push({
              type: "error",
              message: `Minimum price is ${symbolFilters.minPrice}`,
              field: "price",
            });
          }

          if (priceValue > symbolFilters.maxPrice) {
            warnings.push({
              type: "error",
              message: `Maximum price is ${symbolFilters.maxPrice}`,
              field: "price",
            });
          }
        }
      }

      // Balance validation
      if (side === "BUY" && estimatedTotal > availableBalance) {
        warnings.push({
          type: "error",
          message: "Your balance is not enough",
          field: "balance",
        });
      }

      if (side === "SELL" && estimatedQuantity > availableBalance) {
        warnings.push({
          type: "error",
          message: "Insufficient balance to sell this quantity",
          field: "quantity",
        });
      }

      // Price deviation warning for limit orders
      if (orderType === "LIMIT" && priceValue > 0 && currentPrice > 0) {
        const deviation = Math.abs((priceValue - currentPrice) / currentPrice) * 100;
        if (deviation > 5) {
          warnings.push({
            type: "warning",
            message: `Price deviates ${deviation.toFixed(1)}% from market price`,
            field: "price",
          });
        }
      }

      setCalculations({
        estimatedCost,
        estimatedQuantity,
        estimatedTotal,
        fees,
        minOrderValue: symbolFilters?.minNotional || 0,
        maxOrderValue: symbolFilters?.maxNotional || 0,
        availableBalance,
        warnings,
      });
    };

    calculateTradingMetrics();
  }, [
    symbol,
    side,
    orderType,
    price,
    quantity,
    percentage,
    balance,
    marketPrice,
    symbolFilters,
  ]);

  return calculations;
}
