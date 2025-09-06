"use client";

import { useState, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { SymbolInfo, calculatePercentageQuantityWithStepSize, formatTradingQuantity } from "@/lib/trading-calculations";

interface PercentageSliderProps {
  maxQuantity: number;
  symbolInfo: SymbolInfo | null;
  onPercentageSelect: (percentage: number) => void;
  className?: string;
}

export function PercentageSlider({ 
  maxQuantity, 
  symbolInfo, 
  onPercentageSelect, 
  className 
}: PercentageSliderProps) {
  const [percentage, setPercentage] = useState([0]);
  const [previewQuantity, setPreviewQuantity] = useState<string>("0");

  // Calculate preview quantity when percentage or symbolInfo changes
  useEffect(() => {
    const currentPercentage = percentage[0];
    if (currentPercentage === 0) {
      setPreviewQuantity("0");
      return;
    }

    const calculatedQuantity = calculatePercentageQuantityWithStepSize(
      maxQuantity,
      currentPercentage,
      symbolInfo
    );
    
    setPreviewQuantity(formatTradingQuantity(calculatedQuantity));
  }, [percentage, maxQuantity, symbolInfo]);

  const handleSliderChange = (value: number[]) => {
    setPercentage(value);
    const currentPercentage = value[0];
    
    // Immediately update the form with the calculated quantity
    onPercentageSelect(currentPercentage);
  };

  // Quick percentage buttons for common values
  const quickPercentages = [25, 50, 75, 100];

  const handleQuickPercentage = (percent: number) => {
    setPercentage([percent]);
    onPercentageSelect(percent);
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Slider */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-foreground">
            Amount Percentage
          </label>
          <div className="text-sm text-muted-foreground">
            {percentage[0]}% = {previewQuantity}
          </div>
        </div>
        
        <div className="px-2">
          <Slider
            value={percentage}
            onValueChange={handleSliderChange}
            max={100}
            min={0}
            step={1}
            className="w-full"
          />
        </div>

        {/* Percentage markers */}
        <div className="flex justify-between text-xs text-muted-foreground px-2">
          <span>0%</span>
          <span>25%</span>
          <span>50%</span>
          <span>75%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Quick percentage buttons */}
      <div className="grid grid-cols-4 gap-2">
        {quickPercentages.map((percent) => (
          <button
            key={percent}
            type="button"
            className={cn(
              "h-8 px-2 text-xs font-medium rounded-md border transition-colors",
              percentage[0] === percent
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background hover:bg-muted border-border"
            )}
            onClick={() => handleQuickPercentage(percent)}
          >
            {percent}%
          </button>
        ))}
      </div>
    </div>
  );
}
