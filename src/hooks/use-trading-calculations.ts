import { useMemo } from "react";
import { UseFormReturn } from "react-hook-form";
import { TradingFormData } from "@/db/schema/order";
import { AssetBalance, AssetPrice } from "@/types/trading";
import {
  calculateMaxQuantity,
  calculatePercentageQuantity,
  calculateTrade,
  formatTradingQuantity,
  TradeCalculation
} from "@/lib/trading-calculations";

interface UseTradingCalculationsProps {
  balance: AssetBalance | null;
  price: AssetPrice | null;
  form: UseFormReturn<TradingFormData>;
  feeRate?: number;
}

export function useTradingCalculations({
  balance,
  price,
  form,
  feeRate = 0.001 // 0.1% default fee
}: UseTradingCalculationsProps) {
  
  // Calculate maximum available quantity
  const maxQuantity = useMemo(() => {
    return calculateMaxQuantity(balance);
  }, [balance]);

  // Watch form values
  const quantity = form.watch('quantity');
  const side = form.watch('side');

  // Calculate trade details
  const tradeCalculation: TradeCalculation = useMemo(() => {
    return calculateTrade(quantity || "0", price, maxQuantity, feeRate);
  }, [quantity, price, maxQuantity, feeRate]);

  // Handle percentage selection
  const handlePercentageSelect = (percentage: number) => {
    const calculatedQuantity = calculatePercentageQuantity(maxQuantity, percentage);
    const formattedQuantity = formatTradingQuantity(calculatedQuantity);
    form.setValue('quantity', formattedQuantity);
  };

  // Calculate percentage options with values
  const percentageOptions = useMemo(() => {
    const options = [25, 50, 75, 100];
    return options.map(percentage => ({
      percentage,
      quantity: calculatePercentageQuantity(maxQuantity, percentage),
      formattedQuantity: formatTradingQuantity(
        calculatePercentageQuantity(maxQuantity, percentage)
      )
    }));
  }, [maxQuantity]);

  // Validation helpers
  const isValidTrade = useMemo(() => {
    return tradeCalculation.isValid && maxQuantity > 0 && !!price;
  }, [tradeCalculation.isValid, maxQuantity, price]);

  const canTrade = useMemo(() => {
    return isValidTrade && parseFloat(quantity || "0") > 0;
  }, [isValidTrade, quantity]);

  // Trading limits and suggestions
  const tradingLimits = useMemo(() => {
    if (!price) return null;
    
    const minQuantity = 0.00000001; // Typical minimum
    const maxValue = maxQuantity * parseFloat(price.price);
    
    return {
      minQuantity,
      maxQuantity,
      maxValue,
      suggestedQuantities: [
        maxQuantity * 0.1,  // 10%
        maxQuantity * 0.25, // 25% 
        maxQuantity * 0.5,  // 50%
        maxQuantity         // 100%
      ].map(q => formatTradingQuantity(q))
    };
  }, [maxQuantity, price]);

  return {
    // Core calculations
    maxQuantity,
    tradeCalculation,
    
    // Form helpers
    handlePercentageSelect,
    percentageOptions,
    
    // Validation
    isValidTrade,
    canTrade,
    
    // Additional data
    tradingLimits,
    side,
    
    // Convenience getters
    estimatedCost: tradeCalculation.estimatedCost,
    formattedCost: tradeCalculation.formattedCost,
    tradingFee: tradeCalculation.fee,
    totalCost: tradeCalculation.total,
    error: tradeCalculation.error
  };
}
