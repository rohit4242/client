/**
 * Manual Trading Feature - Cost Calculator Hook
 * 
 * Real-time cost breakdown calculation hook
 */

import { useMemo, useEffect } from "react";
import type { OrderFormData, CostBreakdown, PriceData } from "../types/manual-trading.types";
import { calculateOrderCost } from "../lib/cost-calculation";

interface UseCostCalculatorParams {
    orderData: OrderFormData;
    currentPrice: PriceData | null;
    baseAsset: string;
    quoteAsset: string;
    makerFee?: number;
    takerFee?: number;
}

export function useCostCalculator({
    orderData,
    currentPrice,
    baseAsset,
    quoteAsset,
    makerFee,
    takerFee,
}: UseCostCalculatorParams): CostBreakdown | null {
    // Memoize cost calculation to avoid unnecessary recalculations
    const costBreakdown = useMemo(() => {
        return calculateOrderCost({
            orderData,
            currentPrice,
            baseAsset,
            quoteAsset,
            makerFee,
            takerFee,
        });
    }, [orderData, currentPrice, baseAsset, quoteAsset, makerFee, takerFee]);

    return costBreakdown;
}
