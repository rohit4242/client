/**
 * useTradingCalculator Hook
 * 
 * Custom hook for trading calculations.
 */

import { useMemo } from "react";
import {
    calculateStopLossPrice,
    calculateTakeProfitPrice,
    calculatePnL,
    calculatePnLPercent,
} from "../utils";


export interface TradingCalculations {
    stopLossPrice: number | null;
    takeProfitPrice: number | null;
    potentialPnL: number | null;
    potentialPnLPercent: number | null;
    riskRewardRatio: number | null;
}

export interface UseTradingCalculatorOptions {
    entryPrice: number;
    quantity: number;
    side: "LONG" | "SHORT";
    stopLossPercent?: number;
    takeProfitPercent?: number;
}

/**
 * Calculate trading metrics (SL, TP, PnL, risk/reward)
 * 
 * @example
 * const calcs = useTradingCalculator({
 *   entryPrice: 50000,
 *   quantity: 0.1,
 *   side: "LONG",
 *   stopLossPercent: 2,
 *   takeProfitPercent: 5,
 * });
 * 
 * console.log(calcs.stopLossPrice); // 49000
 * console.log(calcs.riskRewardRatio); // 2.5
 */
export function useTradingCalculator(
    options: UseTradingCalculatorOptions
): TradingCalculations {
    const { entryPrice, quantity, side, stopLossPercent, takeProfitPercent } = options;

    return useMemo(() => {
        const stopLossPrice = stopLossPercent
            ? calculateStopLossPrice(entryPrice, stopLossPercent, side)
            : null;

        const takeProfitPrice = takeProfitPercent
            ? calculateTakeProfitPrice(entryPrice, takeProfitPercent, side)
            : null;

        const potentialPnL = takeProfitPrice
            ? calculatePnL(entryPrice, takeProfitPrice, quantity, side)
            : null;

        const potentialPnLPercent = takeProfitPrice
            ? calculatePnLPercent(entryPrice, takeProfitPrice, side)
            : null;

        // Calculate risk/reward ratio
        let riskRewardRatio: number | null = null;
        if (stopLossPrice && takeProfitPrice) {
            const risk = Math.abs(calculatePnL(entryPrice, stopLossPrice, quantity, side));
            const reward = Math.abs(calculatePnL(entryPrice, takeProfitPrice, quantity, side));
            riskRewardRatio = risk > 0 ? reward / risk : null;
        }

        return {
            stopLossPrice,
            takeProfitPrice,
            potentialPnL,
            potentialPnLPercent,
            riskRewardRatio,
        };
    }, [entryPrice, quantity, side, stopLossPercent, takeProfitPercent]);
}
