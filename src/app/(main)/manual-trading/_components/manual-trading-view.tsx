"use client";

import { Exchange } from "@/types/exchange";
import { ExchangeSelector } from "./exchange-selector";
import { useState } from "react";
import { TradingForm } from "./trading-form";
import { POPULAR_SYMBOLS } from "@/db/schema/order";
import { getAsset } from "@/db/actions/assets/get-asset";

export default function ManualTradingView() {
  const [selectedExchange, setSelectedExchange] = useState<Exchange | null>(
    null
  );
  const [selectedAsset, setSelectedAsset] = useState<string>(
    POPULAR_SYMBOLS[0]
  );

  const onSelectAssetsChange = async (assets: string[]) => {
    setSelectedAsset(assets[0]);
    const asset = await getAsset(assets[0], selectedExchange!);
    console.log("asset from the onSelectAssetsChange: ", asset);
  };

  return (
    <div className="flex flex-row gap-4 max-w-2xl mx-auto ">
      <div className="flex flex-col gap-4 min-w-64">
        <ExchangeSelector
          onSelect={setSelectedExchange}
          selectedExchange={selectedExchange}
        />
      </div>
      <TradingForm
        selectedExchange={selectedExchange}
        onSelectAssetsChange={onSelectAssetsChange}
        selectedAsset={selectedAsset}
      />
    </div>
  );
}
