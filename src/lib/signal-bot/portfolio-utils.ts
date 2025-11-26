import { SignalBot } from "@/types/signal-bot";

/**
 * Get the appropriate portfolio value for a bot based on its account type
 * @param bot - Signal bot with exchange information
 * @returns Portfolio value (spotValue for SPOT bots, marginValue for MARGIN bots)
 * Falls back to totalValue if specific values are not available
 */
export function getBotPortfolioValue(bot: SignalBot): number {
  if (!bot.exchange) return 0;
  
  if (bot.accountType === 'SPOT') {
    return bot.exchange.spotValue || bot.exchange.totalValue 
      ? parseFloat((bot.exchange.totalValue ?? 0).toString()) 
      : 0;
  } else {
    return bot.exchange.marginValue || bot.exchange.totalValue 
      ? parseFloat((bot.exchange.totalValue ?? 0).toString()) 
      : 0;
  }
}

/**
 * Format portfolio value display with account type indicator
 * @param bot - Signal bot with exchange information
 * @returns Formatted string showing which portfolio value is being used
 */
export function formatBotPortfolioDisplay(bot: SignalBot): string {
  const value = getBotPortfolioValue(bot);
  const type = bot.accountType === 'SPOT' ? 'Spot' : 'Margin';
  
  return `${type} Balance: $${value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

/**
 * Calculate position size based on bot settings and appropriate portfolio value
 * @param bot - Signal bot with exchange and settings
 * @param currentPrice - Current price of the asset
 * @returns Calculated position size in USD
 */
export function calculateBotPositionSize(bot: SignalBot, currentPrice: number): {
  portfolioValue: number;
  positionPercent: number;
  positionValue: number;
  quantity: number;
  leverage: number;
  totalPositionSize: number;
} {
  const portfolioValue = getBotPortfolioValue(bot);
  const positionPercent = bot.portfolioPercent || 0;
  const leverage = bot.leverage || 1;
  
  // Your capital allocation (what you're risking)
  const positionValue = (portfolioValue * positionPercent) / 100;
  
  // Total position size with leverage
  const totalPositionSize = positionValue * leverage;
  
  // Quantity of asset
  const quantity = currentPrice > 0 ? positionValue / currentPrice : 0;
  
  return {
    portfolioValue,
    positionPercent,
    positionValue,
    quantity,
    leverage,
    totalPositionSize,
  };
}

