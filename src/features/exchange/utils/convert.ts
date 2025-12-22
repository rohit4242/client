/**
 * Utility to convert between Exchange types
 * Handles Date object serialization for client-safe usage
 */

import type { Exchange, ExchangeClient } from "../schemas/exchange.schema";

/**
 * Converts server-side Exchange (with Date objects) to client-safe ExchangeClient (with ISO strings)
 * Use this when passing database exchanges to client-side hooks/components
 * 
 * @param exchange - Server-side Exchange object from database
 * @returns Client-safe ExchangeClient with serialized dates
 * 
 * @example
 * const dbExchange = await db.exchange.findUnique(...);
 * const clientExchange = toExchangeClient(dbExchange);
 * // Now safe to pass to hooks expecting ExchangeClient
 */
export function toExchangeClient(exchange: Exchange): ExchangeClient {
    return {
        ...exchange,
        lastSyncedAt: exchange.lastSyncedAt?.toISOString() ?? null,
        createdAt: exchange.createdAt.toISOString(),
        updatedAt: exchange.updatedAt.toISOString(),
    };
}

/**
 * Checks if an exchange object has Date objects (server type) or strings (client type)
 * Useful for conditional conversion
 */
export function isServerExchange(
    exchange: Exchange | ExchangeClient
): exchange is Exchange {
    return exchange.createdAt instanceof Date;
}

/**
 * Safely converts any exchange object to ExchangeClient
 * Handles both server and client types
 */
export function ensureExchangeClient(
    exchange: Exchange | ExchangeClient
): ExchangeClient {
    if (isServerExchange(exchange)) {
        return toExchangeClient(exchange);
    }
    return exchange;
}
