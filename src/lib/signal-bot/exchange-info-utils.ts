import { Spot } from "@binance/spot";
import { MarginTrading } from "@binance/margin-trading";
import { configurationRestAPI } from "@/types/binance";

/**
 * LOT_SIZE filter information from Binance
 */
export interface LotSizeFilter {
  minQty: number;
  maxQty: number;
  stepSize: number;
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

  // Round down to nearest stepSize multiple
  // Formula: floor(quantity / stepSize) * stepSize
  const steps = Math.floor(quantity / stepSize);
  const formattedQuantity = steps * stepSize;

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

