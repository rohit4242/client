/**
 * Trading Utility Functions
 *
 * Pure calculation functions for signal bot trading operations.
 * No React dependencies - just pure TypeScript functions.
 */

// ============================================================================
// Types
// ============================================================================

export interface AssetPair {
    base: string;
    quote: string;
}

export interface LeveragedPosition {
    positionValue: number;
    leveragedValue: number;
    borrowAmount: number;
    collateralNeeded: number;
}

export interface BuyingPower {
    total: number;
    ownFunds: number;
    borrowable: number;
}

export interface ExitPrices {
    stopLossPrice: number | null;
    takeProfitPrice: number | null;
}

export interface RiskReward {
    riskAmount: number;
    rewardAmount: number;
    ratio: number | null;
    riskPercent: number;
    rewardPercent: number;
}

export interface FundsCheck {
    hasSufficient: boolean;
    needsBorrowing: boolean;
    borrowNeeded: number;
    shortfall: number;
}

// ============================================================================
// Asset Extraction
// ============================================================================

const QUOTE_ASSETS = ["USDT", "FDUSD", "BUSD", "USDC", "BTC", "ETH"] as const;

/**
 * Extract base and quote assets from a trading symbol.
 * @example extractAssets("BTCUSDT") => { base: "BTC", quote: "USDT" }
 */
export function extractAssets(symbol: string): AssetPair {
    for (const quote of QUOTE_ASSETS) {
        if (symbol.endsWith(quote)) {
            return {
                base: symbol.slice(0, -quote.length),
                quote,
            };
        }
    }
    // Fallback: assume last 4 characters are the quote
    return {
        base: symbol.slice(0, -4),
        quote: symbol.slice(-4),
    };
}

// ============================================================================
// Position Calculations
// ============================================================================

/**
 * Calculate position values with leverage.
 */
export function calculateLeveragedPosition(
    amount: number,
    leverage: number
): LeveragedPosition {
    const positionValue = amount;
    const leveragedValue = positionValue * leverage;
    const borrowAmount = leveragedValue - positionValue;
    const collateralNeeded = positionValue;

    return {
        positionValue,
        leveragedValue,
        borrowAmount,
        collateralNeeded,
    };
}

/**
 * Convert trade amount between QUOTE and BASE.
 */
export function convertTradeAmount(
    amount: number,
    amountType: "QUOTE" | "BASE",
    price: number
): { usdtValue: number; baseValue: number } {
    if (amountType === "QUOTE") {
        return {
            usdtValue: amount,
            baseValue: price > 0 ? amount / price : 0,
        };
    }
    return {
        usdtValue: amount * price,
        baseValue: amount,
    };
}

// ============================================================================
// Buying Power
// ============================================================================

/**
 * Calculate total buying power.
 */
export function calculateBuyingPower(
    balance: number,
    maxBorrowable: number,
    accountType: "SPOT" | "MARGIN"
): BuyingPower {
    const ownFunds = balance;
    const borrowable = accountType === "MARGIN" ? maxBorrowable : 0;
    const total = ownFunds + borrowable;

    return { total, ownFunds, borrowable };
}

/**
 * Calculate user's effective max borrow based on their limit percentage.
 */
export function calculateUserMaxBorrow(
    exchangeMaxBorrowable: number,
    maxBorrowPercent: number
): number {
    return exchangeMaxBorrowable * (maxBorrowPercent / 100);
}

// ============================================================================
// Exit Prices (Stop Loss / Take Profit)
// ============================================================================

type PositionSide = "Long" | "Short";

/**
 * Calculate exit prices from percentage-based SL/TP.
 */
export function calculateExitPrices(
    side: PositionSide,
    entryPrice: number,
    stopLossPercent: number | null,
    takeProfitPercent: number | null
): ExitPrices {
    let stopLossPrice: number | null = null;
    let takeProfitPrice: number | null = null;

    if (stopLossPercent !== null && stopLossPercent > 0) {
        stopLossPrice =
            side === "Long"
                ? entryPrice * (1 - stopLossPercent / 100)
                : entryPrice * (1 + stopLossPercent / 100);
    }

    if (takeProfitPercent !== null && takeProfitPercent > 0) {
        takeProfitPrice =
            side === "Long"
                ? entryPrice * (1 + takeProfitPercent / 100)
                : entryPrice * (1 - takeProfitPercent / 100);
    }

    return { stopLossPrice, takeProfitPrice };
}

// ============================================================================
// Risk / Reward
// ============================================================================

/**
 * Calculate risk/reward metrics.
 */
export function calculateRiskReward(
    entryPrice: number,
    stopLossPrice: number | null,
    takeProfitPrice: number | null,
    positionSize: number = 1
): RiskReward {
    const riskAmount = stopLossPrice
        ? Math.abs(entryPrice - stopLossPrice) * positionSize
        : 0;
    const rewardAmount = takeProfitPrice
        ? Math.abs(takeProfitPrice - entryPrice) * positionSize
        : 0;

    const ratio =
        riskAmount > 0 && rewardAmount > 0 ? rewardAmount / riskAmount : null;

    const riskPercent = stopLossPrice
        ? Math.abs((stopLossPrice - entryPrice) / entryPrice) * 100
        : 0;
    const rewardPercent = takeProfitPrice
        ? Math.abs((takeProfitPrice - entryPrice) / entryPrice) * 100
        : 0;

    return { riskAmount, rewardAmount, ratio, riskPercent, rewardPercent };
}

// ============================================================================
// Funds Validation
// ============================================================================

/**
 * Check if user has sufficient funds for a trade.
 */
export function checkSufficientFunds(
    required: number,
    available: number,
    borrowable: number = 0,
    accountType: "SPOT" | "MARGIN" = "SPOT"
): FundsCheck {
    const totalAvailable =
        accountType === "MARGIN" ? available + borrowable : available;

    const hasSufficient = totalAvailable >= required;
    const needsBorrowing = accountType === "MARGIN" && required > available;
    const borrowNeeded = needsBorrowing
        ? Math.min(required - available, borrowable)
        : 0;
    const shortfall = Math.max(0, required - totalAvailable);

    return { hasSufficient, needsBorrowing, borrowNeeded, shortfall };
}

// ============================================================================
// Formatting
// ============================================================================

type FormatType = "price" | "quantity" | "percent" | "currency";

/**
 * Format a number for display.
 */
export function formatTradeNumber(
    value: number,
    type: FormatType = "price"
): string {
    switch (type) {
        case "price":
            return value.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 8,
            });
        case "quantity":
            return value.toLocaleString("en-US", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 8,
            });
        case "percent":
            return (
                value.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                }) + "%"
            );
        case "currency":
            return (
                "$" +
                value.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                })
            );
        default:
            return value.toString();
    }
}
