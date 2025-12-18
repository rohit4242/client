/**
 * Client-safe Binance exports
 * 
 * This file exports only code that is safe to use in client components.
 * It includes hooks, schemas, and utilities but NO SDK code that requires Node.js modules.
 * 
 * USE THIS FILE in client components instead of '@/features/binance'
 */

// Hooks - Safe for client components
export * from "./hooks";

// Schemas - Safe for client components  
export * from "./schemas";

// Utilities - Safe for client components
export * from "./utils";

// Re-export commonly used types (interfaces only, no implementations)
export type {
    BinanceConfig,
    BinanceResult,
    BinanceOrderResponse,
    SpotOrderParams,
    MarginOrderParams,
    SymbolInfo,
    PriceTickerEvent,
    WebSocketConnection,
} from "./sdk";
