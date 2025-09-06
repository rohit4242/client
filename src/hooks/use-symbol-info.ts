import { useState, useEffect } from 'react';
import { SymbolInfo } from '@/lib/trading-calculations';
import { Exchange } from '@/types/exchange';

interface UseSymbolInfoProps {
  symbol: string;
  exchange: Exchange | null;
}

export function useSymbolInfo({ symbol, exchange }: UseSymbolInfoProps) {
  const [symbolInfo, setSymbolInfo] = useState<SymbolInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!symbol || !exchange) {
      setSymbolInfo(null);
      return;
    }

    const fetchSymbolInfo = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/account/exchange`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            apiKey: exchange.apiKey,
            apiSecret: exchange.apiSecret,
            symbol: symbol,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch symbol info');
        }

        const data = await response.json();
        
        // Extract symbol info from the response
        if (data.exchangeInfo?.symbols) {
          const foundSymbol = data.exchangeInfo.symbols.find(
            (s: SymbolInfo) => s.symbol === symbol
          );
          setSymbolInfo(foundSymbol || null);
        } else {
          setSymbolInfo(null);
        }
      } catch (err) {
        console.error('Error fetching symbol info:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch symbol info');
        setSymbolInfo(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSymbolInfo();
  }, [symbol, exchange]);

  return {
    symbolInfo,
    isLoading,
    error,
  };
}
