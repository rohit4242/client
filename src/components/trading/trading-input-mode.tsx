"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TradingInput } from "./trading-input";

interface TradingInputModeProps {
  side: "BUY" | "SELL";
  baseAsset: string;
  quoteAsset: string;
  
  // Separate balances for different assets
  baseBalance?: {
    free: string;
    asset: string;
  } | null;
  quoteBalance?: {
    free: string;
    asset: string;
  } | null;
  
  // Form field props
  totalValue?: string;
  amountValue?: string;
  onTotalChange?: (value: string) => void;
  onAmountChange?: (value: string) => void;
  
  // Trading constraints and max values
  maxBuyInfo?: {
    maxByTotal: number;
    maxByAmount: number;
    currency: string;
  } | null;
  constraintMessages?: {
    minQuantity: string;
    stepSize: string;
    minOrder: string;
  };
  
  // Validation
  totalError?: string;
  amountError?: string;
}

export function TradingInputMode({
  side,
  baseAsset,
  quoteAsset,
  baseBalance,
  quoteBalance,
  totalValue,
  amountValue,
  onTotalChange,
  onAmountChange,
  maxBuyInfo,
  constraintMessages,
  totalError,
  amountError,
}: TradingInputModeProps) {
  const [inputMode, setInputMode] = useState<"total" | "amount">("total");

  if (side === "SELL") {
    return (
      <TradingInput
        label="Amount"
        sublabel={constraintMessages?.minQuantity || baseAsset}
        value={amountValue}
        onChange={onAmountChange}
        availableBalance={baseBalance ? `${baseBalance.free} ${baseAsset}` : `0.00000000 ${baseAsset}`}
        availableAsset={baseAsset}
        maxAction={baseBalance ? `Max: ${parseFloat(baseBalance.free).toFixed(8)} ${baseAsset}` : "Max Sell"}
        stepSizeHint={constraintMessages?.stepSize}
        error={amountError}
      />
    );
  }

  // BUY mode with toggle between Total and Amount
  return (
    <div className="space-y-3">
      {/* Mode Toggle */}
      <div className="flex gap-1 p-1 bg-muted rounded-lg">
        <Button
          type="button"
          variant={inputMode === "total" ? "secondary" : "ghost"}
          size="sm"
          className={cn(
            "flex-1 h-8 text-xs",
            inputMode === "total" && "bg-background shadow-sm"
          )}
          onClick={() => setInputMode("total")}
        >
          By Total ({quoteAsset})
        </Button>
        <Button
          type="button"
          variant={inputMode === "amount" ? "secondary" : "ghost"}
          size="sm"
          className={cn(
            "flex-1 h-8 text-xs",
            inputMode === "amount" && "bg-background shadow-sm"
          )}
          onClick={() => setInputMode("amount")}
        >
          By Amount ({baseAsset})
        </Button>
      </div>

       {/* Input based on mode */}
       {inputMode === "total" ? (
         <TradingInput
           label="Total"
           sublabel={constraintMessages?.minOrder || `Minimum 5 ${quoteAsset}`}
           value={totalValue}
           onChange={onTotalChange}
           availableBalance={quoteBalance ? `${quoteBalance.free} ${quoteAsset}` : `0.00000000 ${quoteAsset}`}
           availableAsset={quoteAsset}
           maxAction={maxBuyInfo ? `Max: ${maxBuyInfo.maxByTotal.toFixed(2)} ${quoteAsset}` : "Max Buy"}
           error={totalError}
         />
       ) : (
         <TradingInput
           label="Amount"
           sublabel={constraintMessages?.minQuantity || baseAsset}
           value={amountValue}
           onChange={onAmountChange}
           availableBalance={baseBalance ? `${baseBalance.free} ${baseAsset}` : `0.00000000 ${baseAsset}`}
           availableAsset={baseAsset}
           maxAction={maxBuyInfo ? `Max: ${maxBuyInfo.maxByAmount.toFixed(8)} ${baseAsset}` : "Max Buy"}
           stepSizeHint={constraintMessages?.stepSize}
           error={amountError}
         />
       )}
    </div>
  );
}
