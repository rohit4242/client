import { useState, useEffect } from "react";
import { Exchange } from "@/types/exchange";
import { SpotRestAPI } from "@binance/spot";

interface UseSymbolInfoProps {
  symbol: string;
  exchange: Exchange | null;
}

export function useSymbolInfo({ symbol, exchange }: UseSymbolInfoProps) {
  const [symbolInfo, setSymbolInfo] =
    useState<SpotRestAPI.ExchangeInfoResponse | null>(null);
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
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            apiKey: exchange.apiKey,
            apiSecret: exchange.apiSecret,
            symbol: symbol,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to fetch symbol info");
        }

        const data = await response.json();

        if (data.exchangeInfo) {
          console.log(
            "data.exchangeInfo from the useSymbolInfo hook: ",
            data.exchangeInfo
          );
          setSymbolInfo(data.exchangeInfo);
        } else {
          setSymbolInfo(null);
        }
      } catch (err) {
        console.error("Error fetching symbol info:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch symbol info"
        );
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
