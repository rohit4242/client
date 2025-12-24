import WS from 'ws';
import { MonitoredPosition, SymbolPriceInfo, MonitorStats } from './types';

/**
 * Price Monitor Service
 * Manages symbol subscriptions and price monitoring via a single combined WebSocket stream
 */
export class PriceMonitorService {
    // Single WebSocket connection
    private ws: WS | null = null;

    // Map: symbol -> price info (for stats and quick lookup)
    private symbolPrices: Map<string, SymbolPriceInfo> = new Map();

    // Map: symbol -> Set of position IDs monitoring this symbol
    private symbolPositions: Map<string, Set<string>> = new Map();

    // Map: positionId -> position data (for quick lookup)
    private positions: Map<string, MonitoredPosition> = new Map();

    // Callback when a position should be closed
    private onTriggerClose?: (position: MonitoredPosition, currentPrice: number, reason: 'TAKE_PROFIT' | 'STOP_LOSS') => void;

    // Service state
    private isShuttingDown = false;
    private isConnected = false;
    private reconnectAttempts = 0;
    private maxReconnectDelay = 30000;
    private initialReconnectDelay = 1000;
    private reconnectTimeout?: NodeJS.Timeout;

    // Subscription tracking
    private pendingSubscriptions: Set<string> = new Set();

    constructor() {
        console.log('[PriceMonitor] Service initialized');
        this.connect();
    }

    /**
     * Set the callback for when a position should be closed
     */
    setTriggerCallback(callback: (position: MonitoredPosition, currentPrice: number, reason: 'TAKE_PROFIT' | 'STOP_LOSS') => void) {
        this.onTriggerClose = callback;
    }

    /**
     * Connect to Binance combined stream
     */
    private connect() {
        if (this.isShuttingDown) return;

        // Binance Combined Streams URL
        // We start with an empty stream or symbols we already know we need
        const activeSymbols = Array.from(this.symbolPositions.keys());
        const streams = activeSymbols.length > 0
            ? activeSymbols.map(s => `${s.toLowerCase()}@ticker`).join('/')
            : '!miniTicker@arr'; // Use a low-traffic dummy stream if no symbols yet to keep connection alive

        const wsUrl = `wss://stream.binance.com:9443/stream?streams=${streams}`;

        console.log(`[PriceMonitor] Connecting to ${wsUrl}`);

        this.ws = new WS(wsUrl);

        this.ws.on('open', () => {
            console.log('[PriceMonitor] WebSocket connected');
            this.isConnected = true;
            this.reconnectAttempts = 0;

            // Re-subscribe to all active symbols if this was a reconnection
            if (activeSymbols.length > 0) {
                this.subscribeToSymbols(activeSymbols);
            }
        });

        this.ws.on('message', (data: WS.Data) => {
            try {
                const message = JSON.parse(data.toString());

                // Handle combined stream format: { "stream": "...", "data": { ... } }
                if (message.stream && message.data) {
                    const symbol = message.data.s; // Symbol name from data
                    const price = parseFloat(message.data.c); // Last price

                    this.symbolPrices.set(symbol, {
                        symbol,
                        lastPrice: price,
                        lastUpdate: new Date()
                    });

                    // Log price update periodically for debugging (every 10th update per symbol)
                    if (Math.random() < 0.1) {
                        console.log(`[PriceMonitor] 📈 ${symbol} price: ${price}`);
                    }

                    this.handlePriceUpdate(symbol, price);
                }
            } catch (error) {
                console.error('[PriceMonitor] Error parsing message:', error);
            }
        });

        this.ws.on('error', (error) => {
            console.error('[PriceMonitor] WebSocket error:', error);
        });

        this.ws.on('close', () => {
            this.isConnected = false;
            if (!this.isShuttingDown) {
                this.scheduleReconnect();
            }
        });
    }

    /**
     * Schedule reconnection with exponential backoff
     */
    private scheduleReconnect() {
        if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);

        this.reconnectAttempts++;
        const delay = Math.min(this.initialReconnectDelay * Math.pow(2, this.reconnectAttempts - 1), this.maxReconnectDelay);

        console.log(`[PriceMonitor] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

        this.reconnectTimeout = setTimeout(() => {
            this.connect();
        }, delay);
    }

    /**
     * Subscribe to symbols via live message
     */
    private subscribeToSymbols(symbols: string[]) {
        if (!this.ws || this.ws.readyState !== WS.OPEN) {
            symbols.forEach(s => this.pendingSubscriptions.add(s));
            return;
        }

        const subscribeMsg = {
            method: 'SUBSCRIBE',
            params: symbols.map(s => `${s.toLowerCase()}@ticker`),
            id: Date.now()
        };

        this.ws.send(JSON.stringify(subscribeMsg));
        console.log(`[PriceMonitor] Sent SUBSCRIBE for ${symbols.join(', ')}`);
    }

    /**
     * Unsubscribe from symbols via live message
     */
    private unsubscribeFromSymbols(symbols: string[]) {
        if (!this.ws || this.ws.readyState !== WS.OPEN) return;

        const unsubscribeMsg = {
            method: 'UNSUBSCRIBE',
            params: symbols.map(s => `${s.toLowerCase()}@ticker`),
            id: Date.now()
        };

        this.ws.send(JSON.stringify(unsubscribeMsg));
        console.log(`[PriceMonitor] Sent UNSUBSCRIBE for ${symbols.join(', ')}`);
    }

    /**
     * Add a position to monitoring
     */
    async addPosition(position: MonitoredPosition): Promise<void> {
        if (!position.stopLoss && !position.takeProfit) {
            return;
        }

        this.positions.set(position.id, position);

        if (!this.symbolPositions.has(position.symbol)) {
            this.symbolPositions.set(position.symbol, new Set());
            this.subscribeToSymbols([position.symbol]);
        }

        this.symbolPositions.get(position.symbol)!.add(position.id);
        console.log(`[PriceMonitor] Monitoring ${position.id} for ${position.symbol}`);
    }

    /**
     * Remove a position from monitoring
     */
    async removePosition(positionId: string): Promise<void> {
        const position = this.positions.get(positionId);
        if (!position) return;

        this.positions.delete(positionId);

        const symbolSet = this.symbolPositions.get(position.symbol);
        if (symbolSet) {
            symbolSet.delete(positionId);
            if (symbolSet.size === 0) {
                this.unsubscribeFromSymbols([position.symbol]);
                this.symbolPositions.delete(position.symbol);
                this.symbolPrices.delete(position.symbol);
            }
        }
    }

    /**
     * Handle incoming price update
     */
    private handlePriceUpdate(symbol: string, currentPrice: number): void {
        const positionIds = this.symbolPositions.get(symbol);
        if (!positionIds) return;

        for (const positionId of positionIds) {
            const position = this.positions.get(positionId);
            if (!position) continue;

            const trigger = this.checkTrigger(position, currentPrice);
            if (trigger) {
                console.log(`[PriceMonitor] 🎯 ${trigger.reason} triggered for ${positionId} at ${currentPrice}`);
                if (this.onTriggerClose) {
                    this.onTriggerClose(position, currentPrice, trigger.reason);
                }
            }
        }
    }

    /**
     * Check if a position's TP/SL should trigger
     */
    private checkTrigger(
        position: MonitoredPosition,
        currentPrice: number
    ): { reason: 'TAKE_PROFIT' | 'STOP_LOSS' } | null {
        if (position.side === 'LONG') {
            if (position.takeProfit && currentPrice >= position.takeProfit) return { reason: 'TAKE_PROFIT' };
            if (position.stopLoss && currentPrice <= position.stopLoss) return { reason: 'STOP_LOSS' };
        } else {
            if (position.takeProfit && currentPrice <= position.takeProfit) return { reason: 'TAKE_PROFIT' };
            if (position.stopLoss && currentPrice >= position.stopLoss) return { reason: 'STOP_LOSS' };
        }
        return null;
    }

    /**
     * Get current monitoring statistics
     */
    getStats(): MonitorStats {
        return {
            monitoredPositions: this.positions.size,
            activeSymbols: this.symbolPositions.size,
            symbols: Array.from(this.symbolPositions.keys()),
            isConnected: this.isConnected,
            reconnectAttempts: this.reconnectAttempts,
            uptime: 0 // Will be calculated in index.ts
        };
    }

    /**
     * Gracefully shutdown
     */
    async shutdown(): Promise<void> {
        this.isShuttingDown = true;
        if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);

        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }

        this.symbolPositions.clear();
        this.positions.clear();
        this.symbolPrices.clear();
        console.log('[PriceMonitor] Shutdown complete');
    }
}

