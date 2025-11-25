"use client";

import { useEffect, useState } from 'react';

interface PriceData {
  symbol: string;
  price: string;
  timestamp: number;
}

interface UseCryptoPriceReturn {
  prices: Record<string, PriceData>;
  isConnected: boolean;
  error: string | null;
  reconnect: () => void;
  lastConnected: Date | null;
}

export function useCryptoPrice(symbols: string[]): UseCryptoPriceReturn {
  const [prices, setPrices] = useState<Record<string, PriceData>>({});
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastConnected, setLastConnected] = useState<Date | null>(null);
  const [forceReconnect, setForceReconnect] = useState(0);
  
  // Memoize symbols string to avoid unnecessary reconnections
  const symbolsKey = symbols.join(',');

  useEffect(() => {
    if (symbols.length === 0) return;

    // Convert symbols to lowercase for Binance WebSocket
    // BTCUSDT -> btcusdt
    const streams = symbols
      .map(symbol => `${symbol.toLowerCase()}@ticker`)
      .join('/');

    // Binance WebSocket URL
    const wsUrl = `wss://stream.binance.com:9443/stream?streams=${streams}`;
    
    console.log('🔌 Connecting to WebSocket:', wsUrl);
    
    let ws: WebSocket;
    let reconnectTimeout: NodeJS.Timeout;
    
    const connect = () => {
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('✅ WebSocket Connected');
        setIsConnected(true);
        setError(null);
        setLastConnected(new Date());
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
          console.error('Error parsing WebSocket message:', err);
        }
      };

      ws.onerror = (error) => {
        console.error('❌ WebSocket Error:', error);
        setError('WebSocket connection error');
        setIsConnected(false);
      };

      ws.onclose = () => {
        console.log('🔌 WebSocket Disconnected');
        setIsConnected(false);
        
        // Reconnect after 3 seconds
        reconnectTimeout = setTimeout(() => {
          console.log('🔄 Reconnecting...');
          connect();
        }, 3000);
      };
    };

    connect();

    // Cleanup on unmount
    return () => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbolsKey, forceReconnect]); // Reconnect if symbols change or manual reconnect triggered

  // Manual reconnect function
  const reconnect = () => {
    console.log('🔄 Manual reconnect triggered');
    setPrices({}); // Clear old prices
    setError(null);
    setForceReconnect(prev => prev + 1); // Trigger reconnection
  };

  return { prices, isConnected, error, reconnect, lastConnected };
}

