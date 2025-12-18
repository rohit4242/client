/**
 * Binance Utility Functions
 * 
 * Helper functions for common Binance operations.
 */

// ============================================================================
// PRICE CALCULATIONS
// ============================================================================

/**
 * Calculate stop loss price based on entry price and percentage
 */
export function calculateStopLossPrice(
    entryPrice: number,
    stopLossPercent: number,
    side: "LONG" | "SHORT"
): number {
    if (side === "LONG") {
        // For long positions, SL is below entry
        return entryPrice * (1 - stopLossPercent / 100);
    } else {
        // For short positions, SL is above entry
        return entryPrice * (1 + stopLossPercent / 100);
    }
}

/**
 * Calculate take profit price based on entry price and percentage
 */
export function calculateTakeProfitPrice(
    entryPrice: number,
    takeProfitPercent: number,
    side: "LONG" | "SHORT"
): number {
    if (side === "LONG") {
        // For long positions, TP is above entry
        return entryPrice * (1 + takeProfitPercent / 100);
    } else {
        // For short positions, TP is below entry
        return entryPrice * (1 - takeProfitPercent / 100);
    }
}

/**
 * Calculate PnL for a trade
 */
export function calculatePnL(
    entryPrice: number,
    exitPrice: number,
    quantity: number,
    side: "LONG" | "SHORT"
): number {
    if (side === "LONG") {
        return (exitPrice - entryPrice) * quantity;
    } else {
        return (entryPrice - exitPrice) * quantity;
    }
}

/**
 * Calculate PnL percentage
 */
export function calculatePnLPercent(
    entryPrice: number,
    exitPrice: number,
    side: "LONG" | "SHORT"
): number {
    if (side === "LONG") {
        return ((exitPrice - entryPrice) / entryPrice) * 100;
    } else {
        return ((entryPrice - exitPrice) / entryPrice) * 100;
    }
}

// ============================================================================
// FORMATTING
// ============================================================================

/**
 * Format price with proper precision
 */
export function formatPrice(price: number, decimals: number = 8): string {
    return price.toFixed(decimals);
}

/**
 * Format quantity with proper precision
 */
export function formatQuantity(quantity: number, decimals: number = 8): string {
    return quantity.toFixed(decimals);
}

/**
 * Format currency amount
 */
export function formatCurrency(amount: number, currency: string = "USD"): string {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
}

/**
 * Format percentage
 */
export function formatPercent(value: number, decimals: number = 2): string {
    return `${value >= 0 ? "+" : ""}${value.toFixed(decimals)}%`;
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate if price meets minimum notional
 */
export function meetsMinNotional(
    price: number,
    quantity: number,
    minNotional: number
): boolean {
    return price * quantity >= minNotional;
}

/**
 * Validate if quantity is within limits
 */
export function isValidQuantity(
    quantity: number,
    minQty: number,
    maxQty: number,
    stepSize: number
): boolean {
    // Check if within range
    if (quantity < minQty || quantity > maxQty) {
        return false;
    }

    // Check if matches step size
    const steps = Math.round((quantity - minQty) / stepSize);
    const validQuantity = minQty + steps * stepSize;

    return Math.abs(quantity - validQuantity) < stepSize / 10;
}

/**
 * Round quantity to step size
 */
export function roundToStepSize(quantity: number, stepSize: number): number {
    return Math.floor(quantity / stepSize) * stepSize;
}

// ============================================================================
// SYMBOL PARSING
// ============================================================================

/**
 * Parse symbol into base and quote assets
 */
export function parseSymbol(symbol: string): { base: string; quote: string } | null {
    // Common quote assets
    const quoteAssets = ["USDT", "BUSD", "BTC", "ETH", "BNB", "USD"];

    for (const quote of quoteAssets) {
        if (symbol.endsWith(quote)) {
            const base = symbol.substring(0, symbol.length - quote.length);
            if (base.length > 0) {
                return { base, quote };
            }
        }
    }

    return null;
}

/**
 * Format symbol for display
 */
export function formatSymbol(symbol: string): string {
    const parsed = parseSymbol(symbol);
    if (parsed) {
        return `${parsed.base}/${parsed.quote}`;
    }
    return symbol;
}
