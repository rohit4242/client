/**
 * Signal Bot Calculation Utilities
 * 
 * Centralized calculation functions for signal bot trading operations.
 * All price and risk calculations are consolidated here for consistency.
 */

type PositionSide = "Long" | "Short";

/**
 * Price Calculation Utilities
 */

/**
 * Calculate exit prices (stop loss and take profit) based on percentages
 */
export function calculateExitPrices(
    side: PositionSide,
    currentPrice: number,
    stopLossPercent: number | null,
    takeProfitPercent: number | null
): {
    stopLossPrice: number | null;
    takeProfitPrice: number | null;
} {
    let stopLossPrice: number | null = null;
    let takeProfitPrice: number | null = null;

    if (stopLossPercent !== null && stopLossPercent > 0) {
        stopLossPrice =
            side === "Long"
                ? currentPrice * (1 - stopLossPercent / 100)
                : currentPrice * (1 + stopLossPercent / 100);
    }

    if (takeProfitPercent !== null && takeProfitPercent > 0) {
        takeProfitPrice =
            side === "Long"
                ? currentPrice * (1 + takeProfitPercent / 100)
                : currentPrice * (1 - takeProfitPercent / 100);
    }

    return { stopLossPrice, takeProfitPrice };
}

/**
 * Format price change as absolute and percentage values
 */
export function formatPriceChange(
    entryPrice: number,
    exitPrice: number
): {
    absoluteChange: number;
    percentChange: number;
    isProfit: boolean;
} {
    const absoluteChange = exitPrice - entryPrice;
    const percentChange = (absoluteChange / entryPrice) * 100;
    const isProfit = absoluteChange > 0;

    return {
        absoluteChange,
        percentChange,
        isProfit,
    };
}

/**
 * Calculate risk/reward ratio and potential outcomes
 */
export function calculateRiskReward(
    entryPrice: number,
    stopLossPrice: number | null,
    takeProfitPrice: number | null,
    positionSize: number = 1
): {
    riskAmount: number;
    rewardAmount: number;
    ratio: number | null;
    riskPercent: number;
    rewardPercent: number;
} {
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

    return {
        riskAmount,
        rewardAmount,
        ratio,
        riskPercent,
        rewardPercent,
    };
}

/**
 * Trade Size Calculation Utilities
 */

/**
 * Calculate position size based on trade amount and type
 */
export function calculatePositionSize(
    balance: number,
    currentPrice: number,
    tradeAmount: number,
    tradeAmountType: "QUOTE" | "BASE"
): {
    baseQuantity: number;
    quoteValue: number;
    effectivePrice: number;
} {
    if (tradeAmountType === "QUOTE") {
        // Trade amount is in quote currency (e.g., USDT)
        const quoteValue = Math.min(tradeAmount, balance);
        const baseQuantity = currentPrice > 0 ? quoteValue / currentPrice : 0;
        return {
            baseQuantity,
            quoteValue,
            effectivePrice: currentPrice,
        };
    } else {
        // Trade amount is in base currency (e.g., BTC)
        const baseQuantity = tradeAmount;
        const quoteValue = baseQuantity * currentPrice;
        return {
            baseQuantity,
            quoteValue,
            effectivePrice: currentPrice,
        };
    }
}

/**
 * Calculate borrow amount needed for leveraged position
 */
export function calculateBorrowAmount(
    positionValue: number,
    leverage: number
): {
    leveragedValue: number;
    borrowAmount: number;
    collateralNeeded: number;
} {
    const leveragedValue = positionValue * leverage;
    const borrowAmount = leveragedValue - positionValue;
    const collateralNeeded = positionValue;

    return {
        leveragedValue,
        borrowAmount,
        collateralNeeded,
    };
}

/**
 * Calculate maximum borrowable amount
 */
export function calculateMaxBorrow(
    collateral: number,
    maxBorrowPercent: number,
    maxBorrowableFromExchange: number
): {
    userMaxBorrow: number;
    exchangeMaxBorrow: number;
    effectiveMaxBorrow: number;
} {
    const userMaxBorrow = (maxBorrowableFromExchange * maxBorrowPercent) / 100;
    const exchangeMaxBorrow = maxBorrowableFromExchange;
    const effectiveMaxBorrow = Math.min(userMaxBorrow, exchangeMaxBorrow);

    return {
        userMaxBorrow,
        exchangeMaxBorrow,
        effectiveMaxBorrow,
    };
}

/**
 * Calculate total buying power including borrowed funds
 */
export function calculateBuyingPower(
    balance: number,
    maxBorrowable: number,
    accountType: "SPOT" | "MARGIN"
): {
    totalBuyingPower: number;
    ownFunds: number;
    borrowableFunds: number;
} {
    const ownFunds = balance;
    const borrowableFunds = accountType === "MARGIN" ? maxBorrowable : 0;
    const totalBuyingPower = ownFunds + borrowableFunds;

    return {
        totalBuyingPower,
        ownFunds,
        borrowableFunds,
    };
}

/**
 * Validation Utilities
 */

/**
 * Validate risk management parameters
 */
export function validateRiskParameters(
    stopLossPercent: number | null,
    takeProfitPercent: number | null
): {
    valid: boolean;
    errors: string[];
    warnings: string[];
} {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Stop loss validation
    if (stopLossPercent !== null) {
        if (stopLossPercent < 0.1) {
            errors.push("Stop loss must be at least 0.1%");
        }
        if (stopLossPercent > 50) {
            errors.push("Stop loss cannot exceed 50%");
        }
        if (stopLossPercent > 10) {
            warnings.push("Stop loss above 10% is quite large");
        }
    }

    // Take profit validation
    if (takeProfitPercent !== null) {
        if (takeProfitPercent < 0.1) {
            errors.push("Take profit must be at least 0.1%");
        }
        if (takeProfitPercent > 100) {
            errors.push("Take profit cannot exceed 100%");
        }
    }

    // Risk/reward validation
    if (
        stopLossPercent !== null &&
        takeProfitPercent !== null &&
        stopLossPercent > 0 &&
        takeProfitPercent > 0
    ) {
        const ratio = takeProfitPercent / stopLossPercent;
        if (ratio < 1) {
            warnings.push(
                "Risk/reward ratio below 1:1 - you're risking more than you can gain"
            );
        }
        if (ratio < 1.5) {
            warnings.push(
                "Consider a higher risk/reward ratio (recommended: at least 1:2)"
            );
        }
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings,
    };
}

/**
 * Validate trade amount against constraints
 */
export function validateTradeAmount(
    amount: number,
    balance: number,
    constraints?: {
        minNotional?: number;
        maxNotional?: number;
        minQty?: number;
        maxQty?: number;
    }
): {
    valid: boolean;
    errors: string[];
    warnings: string[];
} {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic validation
    if (amount <= 0) {
        errors.push("Trade amount must be positive");
    }

    if (amount > balance) {
        errors.push("Insufficient balance for this trade amount");
    }

    // Exchange constraints
    if (constraints) {
        if (constraints.minNotional && amount < constraints.minNotional) {
            errors.push(
                `Trade amount below minimum (${constraints.minNotional})`
            );
        }
        if (constraints.maxNotional && amount > constraints.maxNotional) {
            errors.push(
                `Trade amount exceeds maximum (${constraints.maxNotional})`
            );
        }
    }

    // Warnings
    if (amount > balance * 0.5) {
        warnings.push("Using more than 50% of balance - consider risk management");
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings,
    };
}

/**
 * Format number with appropriate decimals for display
 */
export function formatTradeNumber(
    value: number,
    type: "price" | "quantity" | "percent" | "currency" = "price"
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
            return value.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }) + "%";
        case "currency":
            return "$" + value.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            });
        default:
            return value.toString();
    }
}

/**
 * Determine if sufficient funds are available for trade
 */
export function checkSufficientFunds(
    required: number,
    available: number,
    borrowable: number = 0,
    accountType: "SPOT" | "MARGIN" = "SPOT"
): {
    hasSufficient: boolean;
    needsBorrowing: boolean;
    borrowNeeded: number;
    shortfall: number;
} {
    const totalAvailable = accountType === "MARGIN"
        ? available + borrowable
        : available;

    const hasSufficient = totalAvailable >= required;
    const needsBorrowing = accountType === "MARGIN" && required > available;
    const borrowNeeded = needsBorrowing ? Math.min(required - available, borrowable) : 0;
    const shortfall = Math.max(0, required - totalAvailable);

    return {
        hasSufficient,
        needsBorrowing,
        borrowNeeded,
        shortfall,
    };
}
