/**
 * Binance WebSocket SDK
 * 
 * Enhanced WebSocket management for real-time data.
 * - Automatic reconnection with exponential back

off
 * - Multi-stream support
 * - Type-safe event handling
 * - Error recovery
 */

// ============================================================================
// TYPES
// ============================================================================

export interface PriceTickerEvent {
    eventType: "24hrTicker";
    eventTime: number;
    symbol: string;
    priceChange: string;
    priceChangePercent: string;
    weightedAvgPrice: string;
    lastPrice: string;
    lastQty: string;
    openPrice: string;
    highPrice: string;
    lowPrice: string;
    volume: string;
    quoteVolume: string;
    openTime: number;
    closeTime: number;
    tradeCount: number;
}

export interface WebSocketMessage {
    stream: string;
    data: PriceTickerEvent;
}

export interface WebSocketConfig {
    symbols: string[];
    onMessage: (event: PriceTickerEvent) => void;
    onError?: (error: Error) => void;
    onOpen?: () => void;
    onClose?: () => void;
    reconnect?: boolean;
    maxReconnectAttempts?: number;
}

export interface WebSocketConnection {
    ws: WebSocket | null;
    isConnected: boolean;
    reconnectAttempt: number;
    symbols: Set<string>;
    connect: () => void;
    disconnect: () => void;
    addSymbols: (symbols: string[]) => void;
    removeSymbols: (symbols: string[]) => void;
}

// ============================================================================
// WEBSOCKET MANAGEMENT
// ============================================================================

/**
 * Create a WebSocket connection for price tickers
 */
export function createPriceStream(config: WebSocketConfig): WebSocketConnection {
    let ws: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;
    let reconnectAttempt = 0;
    const symbols = new Set(config.symbols.map((s) => s.toUpperCase()));

    const maxAttempts = config.reconnect !== false ? (config.maxReconnectAttempts || 10) : 0;

    /**
     * Build WebSocket URL
     */
    function buildUrl(): string {
        const streams = Array.from(symbols)
            .map((symbol) => `${symbol.toLowerCase()}@ticker`)
            .join("/");

        return `wss://stream.binance.com:9443/stream?streams=${streams}`;
    }

    /**
     * Connect to WebSocket
     */
    function connect() {
        // Clear any existing connection
        if (ws) {
            ws.close();
            ws = null;
        }

        if (symbols.size === 0) {
            console.log("[WebSocket SDK] No symbols to connect");
            return;
        }

        const wsUrl = buildUrl();
        console.log("[WebSocket SDK] Connecting:", { symbols: Array.from(symbols) });

        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            console.log("[WebSocket SDK] ✅ Connected");
            reconnectAttempt = 0;
            if (config.onOpen) {
                config.onOpen();
            }
        };

        ws.onmessage = (event) => {
            try {
                const message: WebSocketMessage = JSON.parse(event.data);

                if (message.stream && message.data) {
                    config.onMessage(message.data);
                }
            } catch (error) {
                console.error("[WebSocket SDK] Error parsing message:", error);
            }
        };

        ws.onerror = (event) => {
            console.error("[WebSocket SDK] ❌ Error:", event);
            if (config.onError) {
                config.onError(new Error("WebSocket error"));
            }
        };

        ws.onclose = () => {
            console.log("[WebSocket SDK] 🔌 Disconnected");
            if (config.onClose) {
                config.onClose();
            }

            // Attempt reconnection
            if (config.reconnect !== false && reconnectAttempt < maxAttempts) {
                reconnectAttempt++;
                const delay = Math.min(1000 * Math.pow(2, reconnectAttempt), 30000);

                console.log(
                    `[WebSocket SDK] 🔄 Reconnecting in ${delay}ms (attempt ${reconnectAttempt}/${maxAttempts})`
                );

                reconnectTimeout = setTimeout(() => {
                    connect();
                }, delay);
            } else if (reconnectAttempt >= maxAttempts) {
                console.error("[WebSocket SDK] ❌ Max reconnection attempts reached");
            }
        };
    }

    /**
     * Disconnect from WebSocket
     */
    function disconnect() {
        if (reconnectTimeout) {
            clearTimeout(reconnectTimeout);
            reconnectTimeout = null;
        }

        if (ws) {
            ws.close();
            ws = null;
        }

        reconnectAttempt = 0;
    }

    /**
     * Add symbols to stream
     */
    function addSymbols(newSymbols: string[]) {
        const hadSymbols = symbols.size > 0;

        newSymbols.forEach((symbol) => {
            symbols.add(symbol.toUpperCase());
        });

        // If we had no symbols before but now we do, or if connection is closed, reconnect
        if (!hadSymbols || !ws || ws.readyState !== WebSocket.OPEN) {
            connect();
        }
    }

    /**
     * Remove symbols from stream
     */
    function removeSymbols(symbolsToRemove: string[]) {
        symbolsToRemove.forEach((symbol) => {
            symbols.delete(symbol.toUpperCase());
        });

        // If no more symbols, disconnect
        if (symbols.size === 0) {
            disconnect();
        }
    }

    // Initial connection
    if (symbols.size > 0) {
        connect();
    }

    return {
        get ws() {
            return ws;
        },
        get isConnected() {
            return ws !== null && ws.readyState === WebSocket.OPEN;
        },
        get reconnectAttempt() {
            return reconnectAttempt;
        },
        get symbols() {
            return symbols;
        },
        connect,
        disconnect,
        addSymbols,
        removeSymbols,
    };
}

/**
 * Simple price stream (just current price updates)
 */
export function createSimplePriceStream(
    symbols: string[],
    onPriceUpdate: (symbol: string, price: string) => void
): WebSocketConnection {
    return createPriceStream({
        symbols,
        onMessage: (event) => {
            onPriceUpdate(event.symbol, event.lastPrice);
        },
        reconnect: true,
        maxReconnectAttempts: 10,
    });
}
