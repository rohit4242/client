import { RiskLevel } from '@/types/margin';

/**
 * Margin level thresholds
 */
export const MARGIN_LEVEL_THRESHOLD = {
  LIQUIDATION: 1.1, // 110% - liquidation happens
  WARNING: 1.3, // 130% - warning zone
  SAFE: 2.0, // 200% - safe zone
};

/**
 * Calculate margin level
 * Margin Level = Total Asset Value / Total Borrowed
 * @param totalAssets - Total asset value
 * @param totalBorrowed - Total borrowed amount
 * @returns Margin level ratio
 */
export const calculateMarginLevel = (
  totalAssets: number,
  totalBorrowed: number
): number => {
  if (totalBorrowed === 0) return Infinity;
  return totalAssets / totalBorrowed;
};

/**
 * Check if position is at risk of liquidation
 * @param marginLevel - Current margin level
 * @returns True if margin level is below warning threshold
 */
export const isLiquidationRisk = (marginLevel: number): boolean => {
  return marginLevel < MARGIN_LEVEL_THRESHOLD.WARNING;
};

/**
 * Get risk level based on margin level
 * @param marginLevel - Current margin level
 * @returns Risk level classification
 */
export const getRiskLevel = (marginLevel: number): RiskLevel => {
  if (marginLevel === Infinity) return 'safe';
  if (marginLevel >= MARGIN_LEVEL_THRESHOLD.SAFE) return 'safe';
  if (marginLevel >= MARGIN_LEVEL_THRESHOLD.WARNING) return 'warning';
  return 'danger';
};

/**
 * Format margin level for display
 * @param level - Margin level value
 * @returns Formatted string
 */

// Fix: Handle null for margin level formatting.
// Accept null or undefined and treat it as 0.
export const formatMarginLevel = (level: number | null | undefined): string => {
  if (level === null || level === undefined || isNaN(level)) return "0";
  // Display up to 6 decimals but trim trailing zeroes
  return parseFloat(level.toFixed(6)).toString();
};


/**
 * Get risk level color for UI
 * @param riskLevel - Risk level
 * @returns Tailwind color class
 */
export const getRiskColor = (riskLevel: RiskLevel): string => {
  switch (riskLevel) {
    case 'safe':
      return 'text-green-600 bg-green-50 border-green-200';
    case 'warning':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'danger':
      return 'text-red-600 bg-red-50 border-red-200';
  }
};

/**
 * Get risk level badge text
 * @param riskLevel - Risk level
 * @returns Display text
 */
export const getRiskBadgeText = (riskLevel: RiskLevel): string => {
  switch (riskLevel) {
    case 'safe':
      return 'Safe';
    case 'warning':
      return 'Warning';
    case 'danger':
      return 'Danger';
  }
};

/**
 * Calculate maximum borrowable amount based on collateral
 * @param totalAssets - Total asset value
 * @param totalBorrowed - Current borrowed amount
 * @param maxLeverageRatio - Maximum leverage allowed (default 3x)
 * @returns Maximum additional amount that can be borrowed
 */
export const calculateMaxBorrowable = (
  totalAssets: number,
  totalBorrowed: number,
  maxLeverageRatio: number = 3
): number => {
  const maxTotalBorrow = totalAssets * (maxLeverageRatio - 1);
  const additionalBorrowable = Math.max(0, maxTotalBorrow - totalBorrowed);
  return additionalBorrowable;
};

/**
 * Calculate estimated interest for a borrow
 * @param borrowAmount - Amount to borrow
 * @param dailyInterestRate - Daily interest rate (e.g., 0.0001 for 0.01%)
 * @param days - Number of days (default 1)
 * @returns Estimated interest amount
 */
export const calculateInterest = (
  borrowAmount: number,
  dailyInterestRate: number,
  days: number = 1
): number => {
  return borrowAmount * dailyInterestRate * days;
};

/**
 * Format asset amount with proper decimals
 * @param amount - Amount to format
 * @param decimals - Number of decimal places (default 8)
 * @returns Formatted string
 */
export const formatAssetAmount = (
  amount: number | string,
  decimals: number = 8
): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '0';
  return num.toFixed(decimals).replace(/\.?0+$/, '');
};

/**
 * Convert BTC value to USD estimate
 * @param btcAmount - Amount in BTC
 * @param btcPrice - BTC price in USD
 * @returns USD value
 */
export const btcToUsd = (btcAmount: number, btcPrice: number): number => {
  return btcAmount * btcPrice;
};

