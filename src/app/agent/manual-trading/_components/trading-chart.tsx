"use client";

import { AdvancedRealTimeChart } from "react-ts-tradingview-widgets";
import { useEffect, useState } from "react";

interface TradingChartProps {
  symbol?: string;
}

export function TradingChart({
  symbol = "BINANCE:BTCUSDT",
}: TradingChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <div className="text-center text-muted-foreground">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <div className="text-sm">Loading chart...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[400px]">
      <AdvancedRealTimeChart
        theme="light"
        autosize
        symbol={symbol}
        interval="15"
        timezone="Etc/UTC"
        style="1"
        locale="en"
        withdateranges
        allow_symbol_change
        save_image
        container_id={`tradingview-chart-${symbol.replace(":", "-")}`}
        toolbar_bg="#ffffff"
        backgroundColor="#ffffff"
        disabled_features={["header_symbol_search", "symbol_search_hot_key"]}
        enabled_features={["study_templates", "side_toolbar_in_fullscreen_mode"]}
      />
    </div>
  );
}
