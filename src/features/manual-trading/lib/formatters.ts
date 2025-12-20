/**
 * Manual Trading Feature - Formatters
 * 
 * Number and currency formatting utilities
 */

/**
 * Format number as currency
 */
export function formatCurrency(amount: number, decimals: number = 2): string {
    return amount.toFixed(decimals);
}

/**
 * Format number with thousands separator
 */
export function formatNumber(num: number, decimals: number = 2): string {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(num);
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals: number = 2): string {
    return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Format price with appropriate decimals
 */
export function formatPrice(price: number, symbol: string): string {
    // USDT pairs typically use 2 decimals
    if (symbol.includes('USDT') || symbol.includes('BUSD') || symbol.includes('USDC')) {
        return formatCurrency(price, 2);
    }

    // BTC pairs use more decimals
    if (symbol.includes('BTC')) {
        return price.toFixed(8);
    }

    // Default
    return formatCurrency(price, 4);
}

/**
 * Format quantity with appropriate decimals
 */
export function formatQuantity(quantity: number, stepSize: number): string {
    // Determine decimals from step size
    const decimals = stepSize.toString().split('.')[1]?.length || 0;
    return quantity.toFixed(decimals);
}

/**
 * Abbreviate large numbers (1000 -> 1K, 1000000 -> 1M)
 */
export function abbreviateNumber(num: number): string {
    if (num >= 1_000_000_000) {
        return `${(num / 1_000_000_000).toFixed(1)}B`;
    }
    if (num >= 1_000_000) {
        return `${(num / 1_000_000).toFixed(1)}M`;
    }
    if (num >= 1_000) {
        return `${(num / 1_000).toFixed(1)}K`;
    }
    return num.toFixed(2);
}
