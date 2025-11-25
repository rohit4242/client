import { SideEffectType } from '@/types/margin';

/**
 * Margin level thresholds for risk assessment
 */
export const MARGIN_LEVEL_THRESHOLD = {
  LIQUIDATION: 1.1, // 110% - liquidation happens here
  WARNING: 1.3, // 130% - warning zone starts
  SAFE: 2.0, // 200% - considered safe
};

/**
 * Side effect options for margin orders
 */
export const SIDE_EFFECT_OPTIONS = [
  {
    value: SideEffectType.NO_SIDE_EFFECT,
    label: 'No Auto Borrow/Repay',
    description: 'Manual borrow/repay required',
  },
  {
    value: SideEffectType.MARGIN_BUY,
    label: 'Auto Borrow',
    description: 'Automatically borrow if balance insufficient',
  },
  {
    value: SideEffectType.AUTO_REPAY,
    label: 'Auto Repay',
    description: 'Automatically repay debt when selling',
  },
] as const;

/**
 * Assets available for margin borrowing
 */
export const BORROWABLE_ASSETS = [
  'USDT',
  'BTC',
  'ETH',
  'BNB',
  'BUSD',
  'ADA',
  'SOL',
  'XRP',
  'DOT',
  'DOGE',
] as const;

/**
 * Default margin leverage ratio
 */
export const DEFAULT_MARGIN_LEVERAGE = 3;

/**
 * Margin risk level colors for UI
 */
export const RISK_LEVEL_COLORS = {
  safe: {
    text: 'text-green-600',
    bg: 'bg-green-50',
    border: 'border-green-200',
    badge: 'bg-green-100 text-green-800',
  },
  warning: {
    text: 'text-yellow-600',
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    badge: 'bg-yellow-100 text-yellow-800',
  },
  danger: {
    text: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
    badge: 'bg-red-100 text-red-800',
  },
} as const;

/**
 * Estimated daily interest rates for different assets (for display purposes)
 * Real rates should be fetched from the API
 */
export const ESTIMATED_DAILY_INTEREST_RATES = {
  USDT: 0.0002, // 0.02%
  BTC: 0.0001, // 0.01%
  ETH: 0.00015, // 0.015%
  BNB: 0.00018, // 0.018%
  BUSD: 0.0002, // 0.02%
} as const;

/**
 * Margin trading warning messages
 */
export const MARGIN_WARNINGS = {
  HIGH_RISK:
    'Margin trading involves high risk. You can lose more than your initial investment.',
  LIQUIDATION:
    'Your position may be liquidated if margin level falls below 110%.',
  INTEREST_ACCRUAL:
    'Interest accrues hourly on borrowed amounts. Repay loans to reduce costs.',
  API_PERMISSIONS:
    'Ensure your Binance API key has "Enable Spot & Margin Trading" permission enabled.',
} as const;

/**
 * Refresh intervals in milliseconds
 */
export const REFRESH_INTERVALS = {
  MARGIN_ACCOUNT: 10000, // 10 seconds
  MARGIN_ORDERS: 5000, // 5 seconds
  INTEREST_HISTORY: 60000, // 1 minute
} as const;

