/**
 * Binance Client Wrapper
 * 
 * Centralized Binance client management with:
 * - Standard error handling
 * - Type-safe configuration
 * - Logging capabilities
 * - Client initialization
 */

import { Spot } from "@binance/spot";
import { MarginTrading } from "@binance/margin-trading";

// ============================================================================
// TYPES
// ============================================================================

export interface BinanceConfig {
    apiKey: string;
    apiSecret: string;
}

export interface BinanceError {
    code: string;
    msg: string;
}

export interface BinanceResult<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    errorCode?: string;
}

// ============================================================================
// CLIENT CREATION
// ============================================================================

/**
 * Create a Binance Spot client
 */
export function createSpotClient(config: BinanceConfig): Spot {
    return new Spot({
        configurationRestAPI: {
            apiKey: config.apiKey,
            apiSecret: config.apiSecret,
        },
    });
}

/**
 * Create a Binance Margin Trading client
 */
export function createMarginClient(config: BinanceConfig): MarginTrading {
    return new MarginTrading({
        configurationRestAPI: {
            apiKey: config.apiKey,
            apiSecret: config.apiSecret,
        },
    });
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * Standardized Binance error handler
 * Converts Binance API errors to user-friendly messages
 */
export function handleBinanceError<T = unknown>(error: unknown): BinanceResult<T> {
    console.error("[Binance SDK] Error:", error);

    // Handle Binance API errors
    if (
        error &&
        typeof error === "object" &&
        "response" in error &&
        error.response &&
        typeof error.response === "object" &&
        "data" in error.response
    ) {
        const binanceError = (
            error.response as { data: BinanceError }
        ).data;

        // Map common Binance error codes to user-friendly messages
        const errorMessage = mapBinanceErrorCode(binanceError.code, binanceError.msg);

        return {
            success: false,
            error: errorMessage,
            errorCode: binanceError.code,
        };
    }

    // Handle network or other errors
    const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";

    return {
        success: false,
        error: errorMessage,
    };
}

/**
 * Map Binance error codes to user-friendly messages
 */
function mapBinanceErrorCode(code: string, originalMsg: string): string {
    const errorMap: Record<string, string> = {
        // Authentication errors
        "-1022": "Invalid API key or signature",
        "-2015": "Invalid API key, IP, or permissions for action",

        // Order errors
        "-1013": "Invalid quantity - check symbol filters",
        "-1111": "Precision is over the maximum defined for this asset",
        "-2010": "Insufficient balance",
        "-2011": "Unknown order",

        // OCO order errors
        "-1130": "Invalid data sent for OCO order",
        "-1131": "Invalid listClientOrderId",
        "-1107": "Mandatory parameter was not sent, was empty/null, or malformed",

        // Symbol errors
        "-1121": "Invalid symbol",

        // Rate limiting
        "-1003": "Too many requests - rate limit exceeded",

        // Market errors
        "-1104": "Not all sent parameters were read",
        "-1015": "Too many new orders - rate limit exceeded",
    };

    return errorMap[code] || originalMsg || "Binance API error";
}

/**
 * Success result helper
 */
export function successResult<T>(data: T): BinanceResult<T> {
    return {
        success: true,
        data,
    };
}

/**
 * Error result helper
 */
export function errorResult<T = unknown>(error: string, code?: string): BinanceResult<T> {
    return {
        success: false,
        error,
        errorCode: code,
    };
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate Binance configuration
 */
export function validateConfig(config: BinanceConfig): boolean {
    if (!config.apiKey || config.apiKey.trim() === "") {
        throw new Error("API key is required");
    }
    if (!config.apiSecret || config.apiSecret.trim() === "") {
        throw new Error("API secret is required");
    }
    return true;
}

/**
 * Validate symbol format
 */
export function validateSymbol(symbol: string): boolean {
    // Binance symbols are uppercase, no spaces, typically 6-10 characters
    const symbolRegex = /^[A-Z0-9]{4,12}$/;
    return symbolRegex.test(symbol);
}

// ============================================================================
// LOGGING
// ============================================================================

/**
 * Log Binance request (for debugging)
 */
export function logRequest(operation: string, params: Record<string, unknown>): void {
    if (process.env.NODE_ENV === "development") {
        console.log(`[Binance SDK] ${operation}:`, params);
    }
}

/**
 * Log Binance response (for debugging)
 */
export function logResponse(operation: string, response: unknown): void {
    if (process.env.NODE_ENV === "development") {
        console.log(`[Binance SDK] ${operation} response:`, response);
    }
}
