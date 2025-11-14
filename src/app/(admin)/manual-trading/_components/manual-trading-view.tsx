"use client";

import { Exchange } from "@/types/exchange";
import { ExchangeSelector } from "./exchange-selector";
import { useState } from "react";
import { TradingForm } from "./trading-form";
import { POPULAR_SYMBOLS } from "@/db/schema/order";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TradingChart } from "./trading-chart";
import { UserWithAgent } from "@/db/actions/admin/get-all-users";

interface ManualTradingViewProps {
  selectedUser: UserWithAgent;
}

export default function ManualTradingView({ selectedUser }: ManualTradingViewProps) {
  const [selectedExchange, setSelectedExchange] = useState<Exchange | null>(
    null
  );
  const [selectedAsset, setSelectedAsset] = useState<string>(
    POPULAR_SYMBOLS[0]
  );

  const onSelectAssetsChange = (assets: string[]) => {
    setSelectedAsset(assets[0]);
  };

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-12rem)]">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
        {/* Left Columns - Chart Area */}
        <div className="lg:col-span-2 flex flex-col min-h-0 order-2 lg:order-1">
          <div className="flex-1 min-h-[300px] lg:min-h-0 rounded-lg border overflow-hidden">
            <TradingChart symbol={`BINANCE:${selectedAsset}`} />
          </div>
        </div>

        {/* Right Column - Trading Forms */}
        <div className="lg:col-span-1 flex flex-col min-h-0 order-1 lg:order-2">
          <ScrollArea className="flex-1 max-h-full">
            <div className="space-y-6 pl-4 pb-4">
              {/* Exchange Selection */}
              <ExchangeSelector
                onSelect={setSelectedExchange}
                selectedExchange={selectedExchange}
                userId={selectedUser.id}
              />

              {/* Trading Form */}
              <TradingForm
                selectedExchange={selectedExchange}
                onSelectAssetsChange={onSelectAssetsChange}
                selectedAsset={selectedAsset}
                userId={selectedUser.id}
                portfolioId={selectedUser.portfolioId}
              />
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
