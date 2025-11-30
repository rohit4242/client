"use client";

import { useState } from 'react';
import { useCryptoPrice } from '@/hooks/trading/use-crypto-price';
import { PriceTickerGrid } from '@/components/price-ticker';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

export default function LivePricesPage() {
  const symbols = ['BTCUSDT', 'BTCFUSDT','ETHUSDT', 'ETHFUSDT', 'BNBUSDT', 'SOLUSDT', 'ADAUSDT', 'XRPUSDT', 'DOGEUSDT', 'DOTUSDT'];
  const { prices, isConnected, reconnect, lastConnected } = useCryptoPrice(symbols);
  const [isReconnecting, setIsReconnecting] = useState(false);

  const handleReconnect = () => {
    setIsReconnecting(true);
    reconnect();
    setTimeout(() => setIsReconnecting(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Live Crypto Prices</h1>
          <p className="text-muted-foreground">
            Real-time cryptocurrency prices via WebSocket
          </p>
          {lastConnected && (
            <p className="text-xs text-muted-foreground mt-1">
              Connected since: {lastConnected.toLocaleString()}
            </p>
          )}
        </div>
        <Button 
          onClick={handleReconnect} 
          disabled={isReconnecting}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isReconnecting ? 'animate-spin' : ''}`} />
          {isReconnecting ? 'Reconnecting...' : 'Refresh Connection'}
        </Button>
      </div>

      {/* Price Grid */}
      <PriceTickerGrid symbols={symbols} />

      {/* Detailed Price Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Price Information</CardTitle>
          <CardDescription>
            Complete price data for all tracked cryptocurrencies
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">Symbol</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase">Price (USD)</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase">Last Update</th>
                  <th className="px-6 py-3 text-center text-xs font-medium uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {symbols.map(symbol => {
                  const priceData = prices[symbol];
                  return (
                    <tr key={symbol} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap font-medium">{symbol}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right font-mono text-lg">
                        {priceData ? (
                          <span className="text-green-600 dark:text-green-400">
                            ${parseFloat(priceData.price).toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            })}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">---</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-muted-foreground">
                        {priceData ? new Date(priceData.timestamp).toLocaleTimeString() : '---'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {priceData ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            Live
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                            Waiting...
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Info Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Connection Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                <div>
                  <span className="text-2xl font-bold">
                    {isConnected ? 'Connected' : 'Disconnected'}
                  </span>
                  <p className="text-xs text-muted-foreground mt-1">
                    {isConnected ? 'Receiving live updates from Binance' : 'Attempting to reconnect...'}
                  </p>
                </div>
              </div>
              {!isConnected && (
                <Button 
                  onClick={handleReconnect} 
                  disabled={isReconnecting}
                  size="sm"
                  variant="outline"
                >
                  <RefreshCw className={`h-4 w-4 ${isReconnecting ? 'animate-spin' : ''}`} />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Symbols Tracked</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{symbols.length}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Cryptocurrencies being monitored
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Update Method</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">WebSocket</div>
            <p className="text-xs text-muted-foreground mt-2">
              Real-time updates with ~100ms latency
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

