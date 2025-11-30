import { Spot } from "@binance/spot";
import { configurationRestAPI } from "@/types/binance";
import type { BinanceConfig } from "@/lib/services/exchange/types";
import { MarginTrading } from "@binance/margin-trading";

/**
 * LOT_SIZE filter information from Binance
 */
export interface LotSizeFilter {
  minQty: number;
  maxQty: number;
  stepSize: number;
}

/**
 * Complete trading constraints from Binance
 */
export interface TradingConstraints {
  minQty: number;
  maxQty: number;
  stepSize: number;
  minNotional: number;
  maxNotional?: number;
}

/**
 * Order validation result
 */
export interface OrderValidationResult {
  valid: boolean;
  formattedQuantity: number;
  error?: string;
}

/**
 * Cache for exchange info to avoid repeated API calls
 */
const exchangeInfoCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

/**
 * Fetch exchange info for a symbol
 * @param config - API configuration
 * @param symbol - Trading symbol (e.g., "BNBUSDT")
 * @returns Exchange info for the symbol
 */
export async function fetchExchangeInfo(
  config: configurationRestAPI,
  symbol: string
): Promise<any> {
  const cacheKey = symbol;
  const cached = exchangeInfoCache.get(cacheKey);

  // Return cached data if still valid
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`Using cached exchange info for ${symbol}`);
    return cached.data;
  }

  try {
    const client = new Spot({ configurationRestAPI: config });
    const response = await client.restAPI.exchangeInfo({ symbol });
    const data = await response.data();

    // Cache the result
    exchangeInfoCache.set(cacheKey, {
      data,
      timestamp: Date.now(),
    });

    console.log(`Fetched exchange info for ${symbol}`);
    return data;
  } catch (error) {
    console.error(`Error fetching exchange info for ${symbol}:`, error);
    throw error;
  }
}

/**
 * Extract LOT_SIZE filter from exchange info
 * @param exchangeInfo - Exchange info response
 * @returns LOT_SIZE filter details
 */
export function extractLotSizeFilter(exchangeInfo: any): LotSizeFilter | null {
  try {
    const symbolInfo = exchangeInfo.symbols?.[0];
    if (!symbolInfo) {
      console.error("No symbol info found in exchange info");
      return null;
    }

    const lotSizeFilter = symbolInfo.filters?.find(
      (f: any) => f.filterType === "LOT_SIZE"
    );

    if (!lotSizeFilter) {
      console.error("No LOT_SIZE filter found");
      return null;
    }

    return {
      minQty: parseFloat(lotSizeFilter.minQty),
      maxQty: parseFloat(lotSizeFilter.maxQty),
      stepSize: parseFloat(lotSizeFilter.stepSize),
    };
  } catch (error) {
    console.error("Error extracting LOT_SIZE filter:", error);
    return null;
  }
}

/**
 * Get LOT_SIZE filter for a symbol
 * @param config - API configuration
 * @param symbol - Trading symbol
 * @returns LOT_SIZE filter or null if failed
 */
export async function getSymbolLotSize(
  config: configurationRestAPI,
  symbol: string
): Promise<LotSizeFilter | null> {
  try {
    const exchangeInfo = await fetchExchangeInfo(config, symbol);
    return extractLotSizeFilter(exchangeInfo);
  } catch (error) {
    console.error(`Failed to get LOT_SIZE for ${symbol}:`, error);
    return null;
  }
}

/**
 * Format quantity to meet LOT_SIZE requirements
 * @param quantity - Raw quantity
 * @param lotSize - LOT_SIZE filter constraints
 * @returns Formatted quantity that meets Binance requirements
 */
export function formatQuantityToLotSize(
  quantity: number,
  lotSize: LotSizeFilter
): number {
  const { minQty, maxQty, stepSize } = lotSize;

  // Ensure quantity is within min/max bounds
  if (quantity < minQty) {
    console.warn(`Quantity ${quantity} below minQty ${minQty}, using minQty`);
    return minQty;
  }

  if (quantity > maxQty) {
    console.warn(`Quantity ${quantity} above maxQty ${maxQty}, using maxQty`);
    return maxQty;
  }

  // Determine precision from stepSize
  const stepSizeStr = stepSize.toString();
  const precision = stepSizeStr.includes('.') ? stepSizeStr.split('.')[1].length : 0;

  // Round down to nearest stepSize multiple with precision handling
  // Add tiny epsilon for float division stability (e.g. 5.999999 -> 6)
  const steps = Math.floor(quantity / stepSize + 0.00000001);
  const rawFormatted = steps * stepSize;

  // Fix precision to avoid 0.00006000000000000001
  const formattedQuantity = parseFloat(rawFormatted.toFixed(precision));

  // Ensure we're still above minQty after rounding
  if (formattedQuantity < minQty) {
    console.warn(`Rounded quantity ${formattedQuantity} below minQty, using minQty ${minQty}`);
    return minQty;
  }

  console.log(`Quantity formatted: ${quantity} → ${formattedQuantity} (stepSize: ${stepSize})`);
  return formattedQuantity;
}

/**
 * Format quantity with proper precision for display
 * Removes trailing zeros while respecting step size
 */
export function formatQuantityForDisplay(quantity: number, stepSize: number): string {
  // Determine decimal places from stepSize
  const stepSizeStr = stepSize.toString();
  const decimalPlaces = stepSizeStr.includes('.')
    ? stepSizeStr.split('.')[1].length
    : 0;

  return quantity.toFixed(decimalPlaces);
}

/**
 * Extract complete trading constraints including MIN_NOTIONAL
 */
export function extractTradingConstraints(exchangeInfo: any): TradingConstraints | null {
  try {
    const symbolInfo = exchangeInfo.symbols?.[0];
    if (!symbolInfo) {
      console.error("No symbol info found in exchange info");
      return null;
    }

    const constraints: Partial<TradingConstraints> = {};

    for (const filter of symbolInfo.filters || []) {
      switch (filter.filterType) {
        case "LOT_SIZE":
          constraints.minQty = parseFloat(filter.minQty || "0");
          constraints.maxQty = parseFloat(filter.maxQty || "0");
          constraints.stepSize = parseFloat(filter.stepSize || "0");
          break;
        case "NOTIONAL":
        case "MIN_NOTIONAL":
          constraints.minNotional = parseFloat(filter.minNotional || "0");
          if (filter.maxNotional) {
            constraints.maxNotional = parseFloat(filter.maxNotional);
          }
          break;
      }
    }

    // Ensure we have the essential constraints
    if (constraints.minQty === undefined || constraints.stepSize === undefined) {
      console.error("Missing essential LOT_SIZE constraints");
      return null;
    }

    // Default minNotional to 5 USDT if not found (common Binance minimum)
    if (constraints.minNotional === undefined) {
      constraints.minNotional = 5;
    }

    return constraints as TradingConstraints;
  } catch (error) {
    console.error("Error extracting trading constraints:", error);
    return null;
  }
}

/**
 * Get complete trading constraints for a symbol
 */
export async function getSymbolConstraints(
  config: configurationRestAPI,
  symbol: string
): Promise<TradingConstraints | null> {
  try {
    const exchangeInfo = await fetchExchangeInfo(config, symbol);
    return extractTradingConstraints(exchangeInfo);
  } catch (error) {
    console.error(`Failed to get trading constraints for ${symbol}:`, error);
    return null;
  }
}

/**
 * Validate and format order quantity
 * Returns validation result with formatted quantity or error
 */
export function validateAndFormatOrderQuantity(
  rawQuantity: number,
  currentPrice: number,
  constraints: TradingConstraints
): OrderValidationResult {
  const { minQty, maxQty, stepSize, minNotional } = constraints;

  // Check if quantity is below minimum
  if (rawQuantity < minQty) {
    return {
      valid: false,
      formattedQuantity: 0,
      error: `Quantity ${rawQuantity.toFixed(8)} is below minimum ${minQty}`,
    };
  }

  // Check if quantity exceeds maximum
  if (rawQuantity > maxQty) {
    return {
      valid: false,
      formattedQuantity: 0,
      error: `Quantity ${rawQuantity.toFixed(8)} exceeds maximum ${maxQty}`,
    };
  }

  // Format quantity to step size
  const formattedQuantity = formatQuantityToLotSize(rawQuantity, { minQty, maxQty, stepSize });

  // Check MIN_NOTIONAL
  const orderValue = formattedQuantity * currentPrice;
  if (orderValue < minNotional) {
    return {
      valid: false,
      formattedQuantity: 0,
      error: `Order value ${orderValue.toFixed(2)} is below minimum ${minNotional} USDT`,
    };
  }

  return {
    valid: true,
    formattedQuantity,
  };
}

/**
 * Get available balance for a specific asset in spot account
 */
export async function getSpotBalance(
  config: BinanceConfig | configurationRestAPI,
  asset: string
): Promise<{ available: number; locked: number }> {
  try {
    const client = new Spot({
      configurationRestAPI: config as configurationRestAPI
    });
    const response = await client.restAPI.getAccount({
      omitZeroBalances: true,
    });
    const { balances } = await response.data();

    const assetBalance = balances?.find((b: any) => b.asset === asset);

    if (!assetBalance) {
      return { available: 0, locked: 0 };
    }

    return {
      available: parseFloat(assetBalance.free || '0'),
      locked: parseFloat(assetBalance.locked || '0'),
    };
  } catch (error) {
    console.error(`Error fetching spot balance for ${asset}:`, error);
    return { available: 0, locked: 0 };
  }
}

/**
 * Validate if user has sufficient balance for the order
 */
export interface BalanceValidationResult {
  valid: boolean;
  available: number;
  required: number;
  error?: string;
}

export async function validateBalance(
  config: BinanceConfig | configurationRestAPI,
  asset: string,
  requiredAmount: number
): Promise<BalanceValidationResult> {
  const balance = await getSpotBalance(config, asset);

  if (balance.available < requiredAmount) {
    return {
      valid: false,
      available: balance.available,
      required: requiredAmount,
      error: `Insufficient ${asset} balance. Need ${requiredAmount.toFixed(4)}, have ${balance.available.toFixed(4)}`,
    };
  }

  return {
    valid: true,
    available: balance.available,
    required: requiredAmount,
  };
}

export const getMarginAccount = async (config: configurationRestAPI) => {
  const client = new MarginTrading({ configurationRestAPI: config });
  const response = await client.restAPI.queryCrossMarginAccountDetails();
  return await response.data();
};

/**
 * Get available balance for a specific asset in CROSS MARGIN account
 */
export async function getMarginBalance(
  config: BinanceConfig | configurationRestAPI,
  asset: string
): Promise<{ available: number; locked: number; borrowed: number; interest: number; netAsset: number }> {
  try {
    const response = await getMarginAccount(config as configurationRestAPI);

    const assetBalance = response.userAssets?.find((b: any) => b.asset === asset);

    if (!assetBalance) {
      return { available: 0, locked: 0, borrowed: 0, interest: 0, netAsset: 0 };
    }

    return {
      available: Number(assetBalance.free || '0'),
      locked: Number(assetBalance.locked || '0'),
      borrowed: Number(assetBalance.borrowed || '0'),
      interest: Number(assetBalance.interest || '0'),
      netAsset: Number(assetBalance.netAsset || '0'),
    };
  } catch (error) {
    console.error(`Error fetching margin balance for ${asset}:`, error);
    return { available: 0, locked: 0, borrowed: 0, interest: 0, netAsset: 0 };
  }
}

export async function getMaxBorrowable(
  config: BinanceConfig | configurationRestAPI,
  asset: string
): Promise<number> {
  try {
    const { MarginTrading } = await import("@binance/margin-trading");
    const client = new MarginTrading({
      configurationRestAPI: config as configurationRestAPI
    });

    const response = await client.restAPI.queryMaxBorrow({
      asset,
    });
    const data = await response.data();

    return parseFloat(data.amount || '0');
  } catch (error) {
    console.error(`Error fetching max borrowable for ${asset}:`, error);
    return 0;
  }
}   