import { calculateTotalUSDValue } from "@/lib/trading-utils";
import { SignalBot } from "@/types/signal-bot";

export interface PositionSizeResult {
  quantity: number;
  value: number;
  maxRisk: number;
  recommendedSize: number;
}

export async function calculatePositionSize(bot: SignalBot, currentPrice: number): Promise<PositionSizeResult> {
  // Get current portfolio value
  const configurationRestAPI = {
    apiKey: bot.exchange!.apiKey,
    apiSecret: bot.exchange!.apiSecret,
  };

  const portfolioValue = await calculateTotalUSDValue(configurationRestAPI);
  
  // Calculate position value based on portfolio percentage
  const positionValue = (portfolioValue * bot.portfolioPercent) / 100;
  
  // Calculate quantity based on current price
  const quantity = positionValue / currentPrice;
  
  // Calculate max risk if stop loss is set
  let maxRisk = 0;
  if (bot.stopLoss) {
    maxRisk = positionValue * (bot.stopLoss / 100);
  }

  // Recommend size based on risk management
  const recommendedMaxRisk = portfolioValue * 0.02; // 2% of portfolio
  const recommendedSize = bot.stopLoss 
    ? Math.min(positionValue, recommendedMaxRisk / (bot.stopLoss / 100))
    : positionValue * 0.5; // 50% of intended size if no stop loss

  return {
    quantity,
    value: positionValue,
    maxRisk,
    recommendedSize,
  };
}

// Calculate DCA step sizes
export function calculateDCASteps(bot: SignalBot, initialPositionValue: number): number[] {
  if (!bot.dcaEnabled || !bot.dcaSteps || !bot.dcaStepPercent) {
    return [];
  }

  const steps: number[] = [];
  let stepValue = initialPositionValue;

  for (let i = 1; i < bot.dcaSteps; i++) {
    // Each DCA step can be same size or increasing
    const dcaMultiplier = 1.0; // Could be configurable
    stepValue = initialPositionValue * dcaMultiplier;
    steps.push(stepValue);
  }

  return steps;
}

// Calculate position size for risk management
export function calculateRiskAdjustedSize(
  portfolioValue: number,
  riskPercentage: number,
  entryPrice: number,
  stopLossPrice: number
): number {
  const maxRiskAmount = portfolioValue * (riskPercentage / 100);
  const riskPerUnit = Math.abs(entryPrice - stopLossPrice);
  
  if (riskPerUnit === 0) {
    return 0;
  }

  const maxQuantity = maxRiskAmount / riskPerUnit;
  return maxQuantity;
}

// Calculate Kelly Criterion position size (advanced)
export function calculateKellyPositionSize(
  winRate: number,
  averageWin: number,
  averageLoss: number,
  portfolioValue: number
): number {
  if (averageLoss === 0) return 0;
  
  const winLossRatio = averageWin / Math.abs(averageLoss);
  const kellyPercentage = (winRate * winLossRatio - (1 - winRate)) / winLossRatio;
  
  // Cap Kelly at 25% for safety
  const cappedKelly = Math.min(kellyPercentage, 0.25);
  
  return portfolioValue * Math.max(cappedKelly, 0);
}

// Position sizing based on volatility
export function calculateVolatilityAdjustedSize(
  baseSize: number,
  currentVolatility: number,
  averageVolatility: number
): number {
  const volatilityRatio = currentVolatility / averageVolatility;
  
  // Reduce size when volatility is high
  const adjustmentFactor = Math.max(0.5, Math.min(1.5, 1 / volatilityRatio));
  
  return baseSize * adjustmentFactor;
}

// Calculate optimal position size considering multiple factors
export async function calculateOptimalPositionSize(
  bot: SignalBot,
  currentPrice: number,
  marketConditions?: {
    volatility?: number;
    trend?: "bullish" | "bearish" | "sideways";
    volume?: number;
  }
): Promise<PositionSizeResult> {
  const baseCalculation = await calculatePositionSize(bot, currentPrice);
  
  let adjustedValue = baseCalculation.value;
  
  // Adjust for market conditions if provided
  if (marketConditions) {
    // Reduce size in high volatility
    if (marketConditions.volatility && marketConditions.volatility > 1.5) {
      adjustedValue *= 0.8;
    }
    
    // Adjust based on trend
    if (marketConditions.trend === "sideways") {
      adjustedValue *= 0.9; // Reduce size in sideways markets
    }
    
    // Adjust for volume
    if (marketConditions.volume && marketConditions.volume < 0.5) {
      adjustedValue *= 0.9; // Reduce size in low volume
    }
  }
  
  // Ensure minimum position size
  const minPositionValue = 10; // $10 minimum
  adjustedValue = Math.max(adjustedValue, minPositionValue);
  
  return {
    ...baseCalculation,
    value: adjustedValue,
    quantity: adjustedValue / currentPrice,
  };
}
