import { MarginTrading, MarginTradingRestAPI } from '@binance/margin-trading';
import { configurationRestAPI } from '@/types/binance';
import { getSymbolLotSize, formatQuantityToLotSize } from '@/lib/signal-bot/exchange-info-utils';

/**
 * Round quantity to appropriate precision for Binance trading
 * This is the fallback function when LOT_SIZE info is not available
 * Different trading pairs have different precision requirements
 * Checks the BASE asset (first part of symbol) for precision
 */
function formatQuantityPrecisionFallback(quantity: number, symbol: string): number {
  // Default precision - use 8 decimals for safety (Binance supports up to 8)
  let precision = 8;
  
  // Extract base asset by removing common quote assets
  const baseAsset = symbol.replace(/USDT|BUSD|USDC|BTC|ETH|BNB|USD$/i, '');
  
  // BTC pairs use 5-6 decimals for BTC quantity
  if (baseAsset === 'BTC' || symbol.startsWith('BTC')) {
    precision = 6;
  }
  // ETH pairs use 4-5 decimals for ETH quantity
  else if (baseAsset === 'ETH' || symbol.startsWith('ETH')) {
    precision = 5;
  }
  // BNB and similar altcoins
  else if (baseAsset === 'BNB' || symbol.startsWith('BNB')) {
    precision = 5;
  }
  // Most other altcoins - keep 8 decimals for safety
  
  // Round down to avoid "over maximum" errors
  const multiplier = Math.pow(10, precision);
  return Math.floor(quantity * multiplier) / multiplier;
}

/**
 * Format quantity to meet Binance LOT_SIZE requirements
 * Fetches actual LOT_SIZE filters from Binance and formats accordingly
 * Falls back to hardcoded precision if API call fails
 */
async function formatQuantityPrecision(
  quantity: number,
  symbol: string,
  config: configurationRestAPI
): Promise<number> {
  try {
    // Try to get actual LOT_SIZE filter from Binance
    const lotSize = await getSymbolLotSize(config, symbol);
    
    if (lotSize) {
      // Use actual Binance LOT_SIZE constraints
      const formattedQuantity = formatQuantityToLotSize(quantity, lotSize);
      console.log(`Using LOT_SIZE filter for ${symbol}: minQty=${lotSize.minQty}, stepSize=${lotSize.stepSize}`);
      return formattedQuantity;
    } else {
      // Fall back to hardcoded precision
      console.warn(`Could not fetch LOT_SIZE for ${symbol}, using fallback precision`);
      return formatQuantityPrecisionFallback(quantity, symbol);
    }
  } catch (error) {
    // If anything fails, use fallback
    console.error(`Error formatting quantity for ${symbol}, using fallback:`, error);
    return formatQuantityPrecisionFallback(quantity, symbol);
  }
}

/**
 * Get cross margin account details
 * Returns account information including balances, borrowed amounts, and margin level
 */
export const getMarginAccount = async (config: configurationRestAPI) => {
  const client = new MarginTrading({ configurationRestAPI: config });
  const response = await client.restAPI.queryCrossMarginAccountDetails();
  return await response.data();
};

/**
 * Borrow assets for margin trading
 * @param config - API configuration
 * @param asset - Asset to borrow (e.g., 'USDT', 'BTC')
 * @param amount - Amount to borrow
 */
export const borrowMargin = async (
  config: configurationRestAPI,
  asset: string,
  amount: string
) => {
  const client = new MarginTrading({ configurationRestAPI: config });
  // For cross-margin: isIsolated = FALSE and symbol must be empty/omitted
  // This allows Binance to handle borrowing with cross-collateral
  const response = await client.restAPI.marginAccountBorrowRepay({
    asset: asset,
    amount: amount,
    isIsolated: 'FALSE',
    symbol: asset, // Empty string for cross-margin (allows auto-conversion)
    type: 'BORROW',
  });
  return await response.data();
};

/**
 * Repay borrowed assets
 * @param config - API configuration
 * @param asset - Asset to repay (e.g., 'USDT', 'BTC')
 * @param amount - Amount to repay
 */
export const repayMargin = async (
  config: configurationRestAPI,
  asset: string,
  amount: string
) => {
  const client = new MarginTrading({ configurationRestAPI: config });
  // For cross-margin: isIsolated = FALSE and symbol must be empty/omitted
  // This allows Binance to use ANY available asset (like USDT) to repay the debt
  const response = await client.restAPI.marginAccountBorrowRepay({
    asset: asset,
    amount: amount,
    isIsolated: 'FALSE',
    symbol: asset, // Empty string for cross-margin (enables cross-asset repayment)
    type: 'REPAY',
  });
  return await response.data();
};

/**
 * Get maximum borrowable amount for an asset
 * @param config - API configuration
 * @param asset - Asset to query
 */
export const getMaxBorrowable = async (
  config: configurationRestAPI,
  asset: string
) => {
  const client = new MarginTrading({ configurationRestAPI: config });
  const response = await client.restAPI.queryMaxBorrow({ 
    asset,
    isolatedSymbol: undefined 
  });
  return await response.data();
};

/**
 * Get margin interest history
 * @param config - API configuration
 * @param asset - Optional asset filter
 */
export const getMarginInterestHistory = async (
  config: configurationRestAPI,
  asset?: string
) => {
  const client = new MarginTrading({ configurationRestAPI: config });
  const params = asset ? { asset } : {};
  const response = await client.restAPI.queryMarginInterestRateHistory({
    asset: asset || 'BTCUSDT',
  });
  return await response.data();
};

/**
 * Place a new cross margin order
 * @param config - API configuration
 * @param params - Order parameters
 */
export const placeMarginOrder = async (
  config: configurationRestAPI,
  params: {
    symbol: string;
    side: 'BUY' | 'SELL';
    type: 'MARKET' | 'LIMIT';
    quantity?: string;
    quoteOrderQty?: string;
    price?: string;
    sideEffectType?: 'NO_SIDE_EFFECT' | 'MARGIN_BUY' | 'AUTO_REPAY';
    timeInForce?: 'GTC' | 'IOC' | 'FOK';
  }
) => {
  const client = new MarginTrading({ configurationRestAPI: config });
  
  // Build order parameters
  const orderParams: any = {
    symbol: params.symbol,
    side: params.side,
    type: params.type,
  };

  if (params.quantity) {
    // Parse and format quantity with proper precision
    const rawQuantity = parseFloat(params.quantity);
    const formattedQuantity = await formatQuantityPrecision(rawQuantity, params.symbol, config);
    orderParams.quantity = formattedQuantity;
    
    console.log(`Quantity formatted: ${rawQuantity} -> ${formattedQuantity}`);
  }
  
  if (params.quoteOrderQty) {
    orderParams.quoteOrderQty = parseFloat(params.quoteOrderQty);
  }
  
  if (params.price) {
    orderParams.price = parseFloat(params.price);
  }
  
  if (params.sideEffectType) {
    orderParams.sideEffectType = params.sideEffectType;
  }
  
  if (params.timeInForce) {
    orderParams.timeInForce = params.timeInForce;
  }

  console.log('Binance margin order params:', orderParams);
  const response = await client.restAPI.marginAccountNewOrder(orderParams);
  console.log('Binance margin order response:', response);
  return await response.data();
};

/**
 * Get all cross margin orders for a symbol
 * @param config - API configuration
 * @param symbol - Trading pair symbol
 */
export const getMarginOrders = async (
  config: configurationRestAPI,
  symbol: string
) => {
  const client = new MarginTrading({ configurationRestAPI: config });
  const response = await client.restAPI.queryMarginAccountsAllOrders({
    symbol,
  });
  return await response.data();
};