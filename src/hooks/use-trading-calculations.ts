import { useMemo } from "react";
import { UseFormReturn } from "react-hook-form";
import { TradingFormData } from "@/db/schema/order";
import { AssetBalance, AssetPrice } from "@/types/trading";
import {
  calculateMaxQuantity,
  calculatePercentageQuantity,
  calculatePercentageQuantityWithStepSize,
  calculateTrade,
  formatTradingQuantity,
  validateLotSizeFilter,
  validateNotionalFilter,
  TradeCalculation,
  SymbolInfo,
  NotionalValidationResult
} from "@/lib/trading-calculations";

interface UseTradingCalculationsProps {
  balance: AssetBalance | null;
  price: AssetPrice | null;
  form: UseFormReturn<TradingFormData>;
  feeRate?: number;
  symbolInfo?: SymbolInfo | null;
}

export function useTradingCalculations({
  balance,
  price,
  form,
  feeRate = 0.001, // 0.1% default fee
  symbolInfo = null
}: UseTradingCalculationsProps) {
  
  // Calculate maximum available quantity
  const maxQuantity = useMemo(() => {
    return calculateMaxQuantity(balance);
  }, [balance]);

  // Watch form values
  const quantity = form.watch('quantity');
  const side = form.watch('side');
  const orderType = form.watch('type');
  const orderPrice = form.watch('price');

  // Validate lot size and notional filters
  const exchangeValidation = useMemo(() => {
    const quantityNum = parseFloat(quantity || "0");
    const priceNum = orderType === 'LIMIT' ? parseFloat(orderPrice || "0") : 
                     price ? parseFloat(price.price) : 0;

    if (!symbolInfo || quantityNum <= 0) {
      return {
        lotSizeValidation: null,
        notionalValidation: null,
        adjustedQuantity: quantityNum,
        hasAdjustments: false,
        allAdjustments: []
      };
    }

    // Validate lot size first
    const lotSizeValidation = validateLotSizeFilter(quantityNum, symbolInfo);
    let adjustedQuantity = lotSizeValidation.adjustedQuantity;

    // Then validate notional if we have a valid price
    let notionalValidation: NotionalValidationResult | null = null;
    if (priceNum > 0) {
      notionalValidation = validateNotionalFilter(
        adjustedQuantity, 
        priceNum, 
        symbolInfo, 
        orderType
      );
      adjustedQuantity = notionalValidation.adjustedQuantity;
    }

    const allAdjustments = [
      ...(lotSizeValidation.adjustments || []),
      ...(notionalValidation?.adjustments || [])
    ];

    return {
      lotSizeValidation,
      notionalValidation,
      adjustedQuantity,
      hasAdjustments: allAdjustments.length > 0,
      allAdjustments,
      isValid: lotSizeValidation.isValid && (notionalValidation?.isValid ?? true)
    };
  }, [quantity, orderPrice, orderType, price, symbolInfo]);

  // Calculate trade details using potentially adjusted quantity
  const tradeCalculation: TradeCalculation = useMemo(() => {
    const effectiveQuantity = exchangeValidation.adjustedQuantity || parseFloat(quantity || "0");
    return calculateTrade(effectiveQuantity, price, maxQuantity, feeRate);
  }, [exchangeValidation.adjustedQuantity, quantity, price, maxQuantity, feeRate]);

  // Handle percentage selection with lot size compliance
  const handlePercentageSelect = (percentage: number) => {
    const calculatedQuantity = calculatePercentageQuantityWithStepSize(
      maxQuantity, 
      percentage, 
      symbolInfo
    );
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
    
    // Exchange filter validation
    exchangeValidation,
    
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
