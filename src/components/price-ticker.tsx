"use client";

import { useCryptoPrice } from '@/hooks/use-crypto-price';
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';

interface PriceData {
  symbol: string;
  price: string;
  timestamp: number;
}

export function PriceTicker({ symbol }: { symbol: string }) {
  const { prices } = useCryptoPrice([symbol]);
  const [priceChange, setPriceChange] = useState<'up' | 'down' | null>(null);
  const [prevPrice, setPrevPrice] = useState<number | null>(null);

  const currentPrice = prices[symbol]?.price;

  useEffect(() => {
    if (currentPrice && prevPrice) {
      const current = parseFloat(currentPrice);
      if (current > prevPrice) {
        setPriceChange('up');
      } else if (current < prevPrice) {
        setPriceChange('down');
      }

      // Reset animation after 500ms
      const timer = setTimeout(() => setPriceChange(null), 500);
      return () => clearTimeout(timer);
    }

    if (currentPrice) {
      setPrevPrice(parseFloat(currentPrice));
    }
  }, [currentPrice, prevPrice]);

  return (
    <Card
      className={`
        transition-all duration-300 p-6
        ${priceChange === 'up' ? 'bg-green-50 dark:bg-green-950 border-green-300 dark:border-green-800' : ''}
        ${priceChange === 'down' ? 'bg-red-50 dark:bg-red-950 border-red-300 dark:border-red-800' : ''}
      `}
    >
      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold text-muted-foreground">{symbol}</span>
        <div className="flex items-center justify-between gap-2">
          <span className="text-2xl font-bold font-mono">
            ${currentPrice ? parseFloat(currentPrice).toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            }) : '---'}
          </span>
          {priceChange === 'up' && <span className="text-green-600 dark:text-green-400 text-xl">▲</span>}
          {priceChange === 'down' && <span className="text-red-600 dark:text-red-400 text-xl">▼</span>}
        </div>
        {prices[symbol] && (
          <span className="text-xs text-muted-foreground">
            {new Date(prices[symbol].timestamp).toLocaleTimeString()}
          </span>
        )}
      </div>
    </Card>
  );
}

interface PriceTickerGridProps {
  symbols: string[];
  onReconnect?: (reconnectFn: () => void) => void;
}

export function PriceTickerGrid({ symbols, onReconnect }: PriceTickerGridProps) {
  const { prices, isConnected, error, reconnect, lastConnected } = useCryptoPrice(symbols);

  // Pass reconnect function to parent if callback provided
  useEffect(() => {
    if (onReconnect) {
      onReconnect(reconnect);
    }
  }, [onReconnect, reconnect]);

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">
              {isConnected ? 'Connected - Real-time updates' : 'Disconnected'}
            </span>
            {lastConnected && (
              <span className="text-xs text-muted-foreground">
                Last connected: {lastConnected.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Price Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {symbols.map(symbol => {
          const priceData = prices[symbol];
          
          return (
            <PriceCard key={symbol} symbol={symbol} priceData={priceData} />
          );
        })}
      </div>
    </div>
  );
}

interface PriceCardProps {
  symbol: string;
  priceData?: PriceData;
}

function PriceCard({ symbol, priceData }: PriceCardProps) {
  const [priceChange, setPriceChange] = useState<'up' | 'down' | null>(null);
  const [prevPrice, setPrevPrice] = useState<number | null>(null);

  const currentPrice = priceData?.price;

  useEffect(() => {
    if (currentPrice && prevPrice) {
      const current = parseFloat(currentPrice);
      if (current > prevPrice) {
        setPriceChange('up');
      } else if (current < prevPrice) {
        setPriceChange('down');
      }

      // Reset animation after 500ms
      const timer = setTimeout(() => setPriceChange(null), 500);
      return () => clearTimeout(timer);
    }

    if (currentPrice) {
      setPrevPrice(parseFloat(currentPrice));
    }
  }, [currentPrice, prevPrice]);

  return (
    <Card
      className={`
        transition-all duration-300 p-6
        ${priceChange === 'up' ? 'bg-green-50 dark:bg-green-950 border-green-300 dark:border-green-800' : ''}
        ${priceChange === 'down' ? 'bg-red-50 dark:bg-red-950 border-red-300 dark:border-red-800' : ''}
      `}
    >
      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold text-muted-foreground">{symbol}</span>
        <div className="flex items-center justify-between gap-2">
          {priceData ? (
            <>
              <span className="text-2xl font-bold font-mono">
                ${parseFloat(priceData.price).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </span>
              {priceChange === 'up' && <span className="text-green-600 dark:text-green-400 text-xl">▲</span>}
              {priceChange === 'down' && <span className="text-red-600 dark:text-red-400 text-xl">▼</span>}
            </>
          ) : (
            <span className="text-muted-foreground">Loading...</span>
          )}
        </div>
        {priceData && (
          <span className="text-xs text-muted-foreground">
            {new Date(priceData.timestamp).toLocaleTimeString()}
          </span>
        )}
      </div>
    </Card>
  );
}

