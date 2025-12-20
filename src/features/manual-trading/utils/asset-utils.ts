/**
 * Manual Trading Feature - Asset Utilities
 * 
 * Utilities for working with trading symbols and assets
 */

/**
 * Extract base asset from symbol
 * Example: BTCUSDT -> BTC
 */
export function extractBaseAsset(symbol: string): string {
    // Common quote currencies
    const quoteCurrencies = ['USDT', 'BUSD', 'USDC', 'BTC', 'ETH', 'BNB', 'FDUSD'];

    for (const quote of quoteCurrencies) {
        if (symbol.endsWith(quote)) {
            return symbol.slice(0, -quote.length);
        }
    }

    // Fallback: return first half of symbol
    return symbol.slice(0, Math.ceil(symbol.length / 2));
}

/**
 * Extract quote asset from symbol
 * Example: BTCUSDT -> USDT
 */
export function extractQuoteAsset(symbol: string): string {
    const baseAsset = extractBaseAsset(symbol);
    return symbol.replace(baseAsset, "");
}

/**
 * Format asset amount with proper decimals
 */
export function formatAssetAmount(amount: number | string, decimals: number = 8): string {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) return '0';
    return num.toFixed(decimals);
}

/**
 * Parse asset amount safely
 */
export function parseAssetAmount(amount: string): number {
    const parsed = parseFloat(amount);
    return isNaN(parsed) ? 0 : parsed;
}
