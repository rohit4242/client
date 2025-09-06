
export interface configurationRestAPI {
    apiKey: string;
    apiSecret: string;
}

export interface configurationWS {
    apiKey: string;
    apiSecret: string;
    wsUrl: string;
}

// Comprehensive Binance Symbol Filter Interfaces
export interface PriceFilter {
    filterType: 'PRICE_FILTER';
    minPrice: string;
    maxPrice: string;
    tickSize: string;
}

export interface LotSizeFilter {
    filterType: 'LOT_SIZE';
    minQty: string;
    maxQty: string;
    stepSize: string;
}

export interface MarketLotSizeFilter {
    filterType: 'MARKET_LOT_SIZE';
    minQty: string;
    maxQty: string;
    stepSize: string;
}

export interface NotionalFilter {
    filterType: 'NOTIONAL';
    minNotional: string;
    maxNotional?: string;
    applyMinToMarket: boolean;
    applyMaxToMarket: boolean;
    avgPriceMins: number;
}

export interface PercentPriceBySideFilter {
    filterType: 'PERCENT_PRICE_BY_SIDE';
    bidMultiplierUp: string;
    bidMultiplierDown: string;
    askMultiplierUp: string;
    askMultiplierDown: string;
    avgPriceMins: number;
}

export interface TrailingDeltaFilter {
    filterType: 'TRAILING_DELTA';
    minTrailingAboveDelta: number;
    maxTrailingAboveDelta: number;
    minTrailingBelowDelta: number;
    maxTrailingBelowDelta: number;
}

export interface IcebergPartsFilter {
    filterType: 'ICEBERG_PARTS';
    limit: number;
}

export interface MaxNumOrdersFilter {
    filterType: 'MAX_NUM_ORDERS';
    maxNumOrders: number;
}

export interface MaxNumOrderListsFilter {
    filterType: 'MAX_NUM_ORDER_LISTS';
    maxNumOrderLists: number;
}

export interface MaxNumAlgoOrdersFilter {
    filterType: 'MAX_NUM_ALGO_ORDERS';
    maxNumAlgoOrders: number;
}

export interface MaxNumOrderAmendsFilter {
    filterType: 'MAX_NUM_ORDER_AMENDS';
    maxNumOrderAmends: number;
}

// Union type for all possible filters
export type BinanceSymbolFilter = 
    | PriceFilter
    | LotSizeFilter
    | MarketLotSizeFilter
    | NotionalFilter
    | PercentPriceBySideFilter
    | TrailingDeltaFilter
    | IcebergPartsFilter
    | MaxNumOrdersFilter
    | MaxNumOrderListsFilter
    | MaxNumAlgoOrdersFilter
    | MaxNumOrderAmendsFilter;

// Complete Binance Symbol Information
export interface BinanceSymbolInfo {
    symbol: string;
    status: 'TRADING' | 'HALT' | 'BREAK';
    baseAsset: string;
    baseAssetPrecision: number;
    quoteAsset: string;
    quotePrecision: number;
    quoteAssetPrecision: number;
    baseCommissionPrecision: number;
    quoteCommissionPrecision: number;
    orderTypes: string[];
    icebergAllowed: boolean;
    ocoAllowed: boolean;
    otoAllowed: boolean;
    quoteOrderQtyMarketAllowed: boolean;
    allowTrailingStop: boolean;
    cancelReplaceAllowed: boolean;
    amendAllowed: boolean;
    pegInstructionsAllowed: boolean;
    isSpotTradingAllowed: boolean;
    isMarginTradingAllowed: boolean;
    filters: BinanceSymbolFilter[];
    permissions: string[];
    permissionSets: string[][];
    defaultSelfTradePreventionMode: string;
    allowedSelfTradePreventionModes: string[];
}

// Exchange Info Response
export interface BinanceExchangeInfo {
    timezone: string;
    serverTime: number;
    rateLimits: Array<{
        rateLimitType: string;
        interval: string;
        intervalNum: number;
        limit: number;
    }>;
    exchangeFilters: Array<BinanceSymbolFilter>;
    symbols: BinanceSymbolInfo[];
}

// Validation Result Interfaces
export interface ValidationResult {
    isValid: boolean;
    error?: string;
    warnings?: string[];
    adjustments?: string[];
}

export interface PriceValidationResult extends ValidationResult {
    adjustedPrice?: number;
    originalPrice?: number;
}

export interface QuantityValidationResult extends ValidationResult {
    adjustedQuantity?: number;
    originalQuantity?: number;
}

export interface NotionalValidationResult extends ValidationResult {
    adjustedQuantity?: number;
    originalQuantity?: number;
    notionalValue?: number;
    minNotional?: number;
    maxNotional?: number;
}

// Order Validation Context
export interface OrderValidationContext {
    symbol: string;
    side: 'BUY' | 'SELL';
    type: 'MARKET' | 'LIMIT';
    quantity: number;
    price?: number;
    symbolInfo: BinanceSymbolInfo;
    currentMarketPrice?: number;
}