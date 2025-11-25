"use client";

import { useLivePrice } from "@/hooks/trading/use-live-price";
import { cn } from "@/lib/utils";

interface LivePriceProps {
  symbol: string;
  className?: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  showUpdateIndicator?: boolean;
  fallbackPrice?: number;
  colorMode?: "default" | "trend" | "green";
  userId?: string;
}

export function LivePrice({
  symbol,
  className = "",
  prefix = "$",
  suffix = "",
  decimals = 2,
  showUpdateIndicator = false,
  fallbackPrice,
  colorMode = "default",
  userId,
}: LivePriceProps) {
  const { price, isUpdating, error } = useLivePrice(symbol, userId);

  // Determine which price to display
  const displayPrice = price ?? fallbackPrice ?? 0;
  
  // Format the price
  const formattedPrice = displayPrice.toFixed(decimals);

  // Determine color classes based on mode
  const getColorClass = () => {
    switch (colorMode) {
      case "trend":
        return price ? "text-green-600" : "text-muted-foreground";
      case "green":
        return "text-green-600";
      default:
        return "";
    }
  };

  // Show error state only if there's an error and no fallback price
  if (error && !price && !fallbackPrice) {
    return (
      <span className={cn("text-red-500 text-xs", className)}>
        Error
      </span>
    );
  }

  return (
    <span 
      className={cn(
        "font-mono transition-colors duration-200",
        getColorClass(),
        isUpdating && showUpdateIndicator && "animate-pulse",
        className
      )}
      title={`Live price for ${symbol}`}
    >
      {prefix}{formattedPrice}{suffix}
      {showUpdateIndicator && isUpdating && (
        <span className="ml-1 text-xs opacity-60">•</span>
      )}
    </span>
  );
}

// Specialized component for mark price display
export function MarkPrice({
  symbol,
  className = "",
  fallbackPrice,
  userId,
}: {
  symbol: string;
  className?: string;
  fallbackPrice?: number;
  userId?: string;
}) {
  return (
    <div className="text-xs text-muted-foreground">
      Mark price:{" "}
      <LivePrice
        symbol={symbol}
        className={cn("text-green-600", className)}
        decimals={2}
        fallbackPrice={fallbackPrice}
        colorMode="green"
        userId={userId}
      />
    </div>
  );
}

// Component for displaying price with trend indicators
export function TrendPrice({
  symbol,
  entryPrice,
  className = "",
  fallbackPrice,
  userId,
}: {
  symbol: string;
  entryPrice?: number;
  className?: string;
  fallbackPrice?: number;
  userId?: string;
}) {
  const { price } = useLivePrice(symbol, userId);
  const currentPrice = price ?? fallbackPrice ?? 0;
  
  let trendColor = "";
  if (entryPrice && currentPrice) {
    if (currentPrice > entryPrice) {
      trendColor = "text-green-600";
    } else if (currentPrice < entryPrice) {
      trendColor = "text-red-600";
    }
  }

  return (
    <LivePrice
      symbol={symbol}
      className={cn(trendColor, className)}
      decimals={4}
      fallbackPrice={fallbackPrice}
      showUpdateIndicator
      userId={userId}
    />
  );
}
