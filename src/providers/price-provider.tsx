"use client";

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";

interface PriceData {
  symbol: string;
  price: string;
  timestamp: number;
}

interface PriceContextValue {
  prices: Record<string, PriceData>;
  isConnected: boolean;
  error: string | null;
  subscribeToSymbols: (symbols: string[]) => void;
  unsubscribeFromSymbols: (symbols: string[]) => void;
}

const PriceContext = createContext<PriceContextValue | undefined>(undefined);

/**
 * Global WebSocket Price Provider
 * Manages a single WebSocket connection and distributes price updates
 * to all subscribing components
 */
export function PriceProvider({ children }: { children: React.ReactNode }) {
  const [prices, setPrices] = useState<Record<string, PriceData>>({});
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const subscribedSymbolsRef = useRef<Set<string>>(new Set());
  const connectionAttemptRef = useRef(0);

  /**
   * Connect to Binance WebSocket with subscribed symbols
   */
  const connect = useCallback(() => {
    // Clear any existing connection
    if (wsRef.current) {
      wsRef.current.close();
    }

    const symbols = Array.from(subscribedSymbolsRef.current);
    
    // Don't connect if no symbols to watch
    if (symbols.length === 0) {
      setIsConnected(false);
      return;
    }

    // Build WebSocket URL with all subscribed symbols
    const streams = symbols
      .map(symbol => `${symbol.toLowerCase()}@ticker`)
      .join('/');
    
    const wsUrl = `wss://stream.binance.com:9443/stream?streams=${streams}`;
    
    console.log('[Price Provider] Connecting to WebSocket:', { symbols });

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[Price Provider] ✅ WebSocket Connected');
      setIsConnected(true);
      setError(null);
      connectionAttemptRef.current = 0;
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.stream && data.data) {
          const ticker = data.data;
          
          setPrices(prev => ({
            ...prev,
            [ticker.s]: {
              symbol: ticker.s,
              price: ticker.c, // Current price
              timestamp: ticker.E, // Event time
            }
          }));
        }
      } catch (err) {
        console.error('[Price Provider] Error parsing message:', err);
      }
    };

    ws.onerror = (error) => {
      console.error('[Price Provider] ❌ WebSocket Error:', error);
      setError('WebSocket connection error');
      setIsConnected(false);
    };

    ws.onclose = () => {
      console.log('[Price Provider] 🔌 WebSocket Disconnected');
      setIsConnected(false);
      
      // Exponential backoff for reconnection
      connectionAttemptRef.current++;
      const delay = Math.min(1000 * Math.pow(2, connectionAttemptRef.current), 30000);
      
      reconnectTimeoutRef.current = setTimeout(() => {
        console.log(`[Price Provider] 🔄 Reconnecting... (attempt ${connectionAttemptRef.current})`);
        connect();
      }, delay);
    };
  }, []);

  /**
   * Subscribe to additional symbols
   */
  const subscribeToSymbols = useCallback((symbols: string[]) => {
    const hadSymbols = subscribedSymbolsRef.current.size > 0;
    
    symbols.forEach(symbol => {
      subscribedSymbolsRef.current.add(symbol.toUpperCase());
    });

    // If we had no symbols before but now we do, or if connection is closed, reconnect
    if (!hadSymbols || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      connect();
    }
  }, [connect]);

  /**
   * Unsubscribe from symbols
   */
  const unsubscribeFromSymbols = useCallback((symbols: string[]) => {
    symbols.forEach(symbol => {
      subscribedSymbolsRef.current.delete(symbol.toUpperCase());
    });

    // If no more symbols, close connection
    if (subscribedSymbolsRef.current.size === 0 && wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const value: PriceContextValue = {
    prices,
    isConnected,
    error,
    subscribeToSymbols,
    unsubscribeFromSymbols,
  };

  return (
    <PriceContext.Provider value={value}>
      {children}
    </PriceContext.Provider>
  );
}

/**
 * Hook to access the price context
 */
export function usePriceContext() {
  const context = useContext(PriceContext);
  if (!context) {
    throw new Error('usePriceContext must be used within PriceProvider');
  }
  return context;
}

