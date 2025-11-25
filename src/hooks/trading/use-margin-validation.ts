import { useMemo } from "react";
import { Exchange } from "@/types/exchange";
import { useMaxBorrow } from "./use-margin-operations";

interface UseMarginValidationProps {
  quoteAsset: string;
  baseAsset: string;
  exchange: Exchange | null;
  sideEffectType: string;
  orderSide: 'BUY' | 'SELL';
  enabled: boolean;
}

interface MarginValidationData {
  maxBorrowableQuote: number | null;
  maxBorrowableBase: number | null;
  isLoadingQuote: boolean;
  isLoadingBase: boolean;
  errorQuote: Error | null;
  errorBase: Error | null;
}

/**
 * Hook to fetch max borrowable amounts for margin trading validation
 * Only fetches when MARGIN_BUY is selected for quote asset (buy orders)
 * and when AUTO_REPAY is selected for base asset (sell orders)
 */
export function useMarginValidation({
  quoteAsset,
  baseAsset,
  exchange,
  sideEffectType,
  orderSide,
  enabled,
}: UseMarginValidationProps): MarginValidationData {
  // Fetch max borrowable for quote asset when MARGIN_BUY is selected for BUY orders
  const shouldFetchQuote = enabled && 
    exchange !== null && 
    sideEffectType === 'MARGIN_BUY' &&
    orderSide === 'BUY';
  
  const {
    data: quoteData,
    isLoading: isLoadingQuote,
    error: errorQuote,
  } = useMaxBorrow(quoteAsset, exchange!, shouldFetchQuote);

  // Fetch max borrowable for base asset when:
  // 1. MARGIN_BUY is selected for SELL orders (short selling - borrow base asset to sell)
  // 2. AUTO_REPAY is selected for SELL orders (optional, for future validation)
  const shouldFetchBase = enabled && 
    exchange !== null && 
    ((sideEffectType === 'MARGIN_BUY' && orderSide === 'SELL') ||
     (sideEffectType === 'AUTO_REPAY' && orderSide === 'SELL'));
  
  const {
    data: baseData,
    isLoading: isLoadingBase,
    error: errorBase,
  } = useMaxBorrow(baseAsset, exchange!, shouldFetchBase);

  return useMemo(() => {
    const maxBorrowableQuote = quoteData?.data?.maxBorrowable 
      ? parseFloat(quoteData.data.maxBorrowable) 
      : null;
    
    const maxBorrowableBase = baseData?.data?.maxBorrowable 
      ? parseFloat(baseData.data.maxBorrowable) 
      : null;

    return {
      maxBorrowableQuote,
      maxBorrowableBase,
      isLoadingQuote,
      isLoadingBase,
      errorQuote: errorQuote as Error | null,
      errorBase: errorBase as Error | null,
    };
  }, [quoteData, baseData, isLoadingQuote, isLoadingBase, errorQuote, errorBase]);
}

