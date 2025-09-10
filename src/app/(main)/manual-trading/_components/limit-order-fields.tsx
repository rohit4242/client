"use client";

import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { TradingFormData } from "@/db/schema/order";
import { AssetPrice } from "@/types/trading";
import { TradingConstraints, validateStepSize, formatToStepSize, isValidStepSize } from "@/lib/trading-constraints";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";

interface LimitOrderFieldsProps {
  form: UseFormReturn<TradingFormData>;
  currentPrice: AssetPrice | null;
  baseAsset: string;
  quoteAsset: string;
  constraints: TradingConstraints | null;
  onFieldChange: () => void;
}

export function LimitOrderFields({
  form,
  currentPrice,
  baseAsset,
  quoteAsset,
  constraints,
  onFieldChange,
}: LimitOrderFieldsProps) {
  const [useTPSL, setUseTPSL] = useState(false);
  const [priceAdjustment, setPriceAdjustment] = useState(0);
  
  const marketPrice = currentPrice ? parseFloat(currentPrice.price) : 0;
  const side = form.watch("side");
  const currentLimitPrice = form.watch("price");

  // Calculate price based on percentage adjustment
  const calculateAdjustedPrice = (percentage: number): number => {
    if (!marketPrice) return 0;
    return marketPrice * (1 + percentage / 100);
  };

  // Handle price slider change
  const handlePriceSliderChange = (values: number[]) => {
    const percentage = values[0];
    setPriceAdjustment(percentage);
    let newPrice = calculateAdjustedPrice(percentage);
    
    // Apply tick size validation if available
    if (constraints?.tickSize) {
      newPrice = validateStepSize(newPrice, constraints.tickSize);
    }
    
    form.setValue("price", formatToStepSize(newPrice, constraints?.tickSize || 0.01));
    onFieldChange();
  };

  // Quick price buttons
  const quickPriceButtons = [
    { label: "-5%", value: -5 },
    { label: "-2%", value: -2 },
    { label: "-1%", value: -1 },
    { label: "Market", value: 0 },
    { label: "+1%", value: 1 },
    { label: "+2%", value: 2 },
    { label: "+5%", value: 5 },
  ];

  const handleQuickPrice = (percentage: number) => {
    setPriceAdjustment(percentage);
    let newPrice = calculateAdjustedPrice(percentage);
    
    // Apply tick size validation if available
    if (constraints?.tickSize) {
      newPrice = validateStepSize(newPrice, constraints.tickSize);
    }
    
    form.setValue("price", formatToStepSize(newPrice, constraints?.tickSize || 0.01));
    onFieldChange();
  };

  // Calculate price difference percentage
  const getPriceDifferencePercentage = (): string => {
    if (!marketPrice || !currentLimitPrice) return "0.00%";
    const limitPrice = parseFloat(currentLimitPrice);
    const diff = ((limitPrice - marketPrice) / marketPrice) * 100;
    return `${diff >= 0 ? "+" : ""}${diff.toFixed(2)}%`;
  };

  return (
    <div className="space-y-4">
      {/* Time in Force */}

      {/* Price Field with Enhanced Controls */}
      <FormField
        control={form.control}
        name="price"
        render={({ field }) => (
          <FormItem>
            <div className="flex items-center justify-between">
              <FormLabel>Price</FormLabel>
              <div className="text-xs text-muted-foreground">
                {getPriceDifferencePercentage()} from market
              </div>
            </div>
            
             <FormControl>
               <div className="relative">
                 <Input 
                   {...field} 
                   placeholder={marketPrice.toFixed(2)}
                   onChange={(e) => {
                     field.onChange(e);
                     onFieldChange();
                   }}
                   onBlur={(e) => {
                     // Apply tick size validation on blur
                     const value = parseFloat(e.target.value);
                     if (!isNaN(value) && constraints?.tickSize && !isValidStepSize(value, constraints.tickSize)) {
                       const validatedValue = validateStepSize(value, constraints.tickSize);
                       const formattedValue = formatToStepSize(validatedValue, constraints.tickSize);
                       form.setValue("price", formattedValue);
                       onFieldChange();
                     }
                   }}
                   className="pr-16"
                 />
                 <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                   {quoteAsset}
                 </div>
               </div>
             </FormControl>
             
             {/* Price constraints info */}
             {constraints && (
               <div className="text-xs text-muted-foreground mt-1">
                 {constraints.tickSize && (
                   <span>Price must be a multiple of {formatToStepSize(constraints.tickSize, constraints.tickSize)} {quoteAsset}</span>
                 )}
               </div>
             )}

            {/* Quick Price Buttons */}
            <div className="grid grid-cols-7 gap-1 mt-2">
              {quickPriceButtons.map((button) => (
                <Button
                  key={button.value}
                  type="button"
                  variant="outline"
                  size="sm"
                  className={`h-6 text-xs ${button.value === 0 ? 'bg-muted' : ''}`}
                  onClick={() => handleQuickPrice(button.value)}
                >
                  {button.label}
                </Button>
              ))}
            </div>

            {/* Price Adjustment Slider */}
            {marketPrice > 0 && (
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Price Adjustment</span>
                  <span>{priceAdjustment >= 0 ? "+" : ""}{priceAdjustment.toFixed(1)}%</span>
                </div>
                <Slider
                  value={[priceAdjustment]}
                  onValueChange={handlePriceSliderChange}
                  min={-10}
                  max={10}
                  step={0.1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>-10%</span>
                  <span>Market</span>
                  <span>+10%</span>
                </div>
              </div>
            )}
            
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Quantity Field */}
      <FormField
        control={form.control}
        name="quantity"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Amount</FormLabel>
             <FormControl>
               <div className="relative">
                 <Input 
                   {...field} 
                   placeholder="0.00000000"
                   onChange={(e) => {
                     field.onChange(e);
                     onFieldChange();
                   }}
                   onBlur={(e) => {
                     // Apply step size validation on blur
                     const value = parseFloat(e.target.value);
                     if (!isNaN(value) && constraints?.stepSize && !isValidStepSize(value, constraints.stepSize)) {
                       const validatedValue = validateStepSize(value, constraints.stepSize);
                       const formattedValue = formatToStepSize(validatedValue, constraints.stepSize);
                       form.setValue("quantity", formattedValue);
                       onFieldChange();
                     }
                   }}
                   className="pr-16"
                 />
                 <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                   {baseAsset}
                 </div>
               </div>
             </FormControl>
             
             {/* Quantity constraints info */}
             {constraints && (
               <div className="text-xs text-muted-foreground mt-1">
                 {constraints.stepSize && (
                   <span>Quantity must be a multiple of {formatToStepSize(constraints.stepSize, constraints.stepSize)} {baseAsset}</span>
                 )}
                 {constraints.minQty && (
                   <span className="ml-2">Min: {formatToStepSize(constraints.minQty, constraints.stepSize)} {baseAsset}</span>
                 )}
               </div>
             )}
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Total Display */}
      <div className="p-3 bg-muted rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Total</span>
          <span className="text-sm">
            {currentLimitPrice && form.watch("quantity") 
              ? (parseFloat(currentLimitPrice) * parseFloat(form.watch("quantity") || "0")).toFixed(2)
              : "0.00"
            } {quoteAsset}
          </span>
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          Minimum 5 {quoteAsset}
        </div>
      </div>

      {/* Take Profit / Stop Loss Section */}
      <div className="space-y-3 p-3 border rounded-lg">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="tp-sl"
            checked={useTPSL}
            onCheckedChange={(checked) => setUseTPSL(checked as boolean)}
          />
          <Label htmlFor="tp-sl" className="text-sm font-medium">
            Take Profit / Stop Loss
          </Label>
        </div>

        {useTPSL && (
          <div className="space-y-3 ml-6">
            {/* Take Profit */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Checkbox id="tp" />
                  <Label htmlFor="tp" className="text-sm">TP/SL</Label>
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">
                  {side === "BUY" ? "Take Profit Price" : "Stop Loss Price"}
                </div>
                <Input
                  placeholder="0.00"
                  className="h-8 text-xs"
                />
              </div>
            </div>

            {/* Additional TP/SL info */}
            <div className="text-xs text-muted-foreground">
              Set automatic take profit and stop loss levels for risk management
            </div>
          </div>
        )}
      </div>

      {/* Order Summary */}
      <div className="p-3 bg-muted/50 rounded-lg text-xs space-y-1">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Avg Price:</span>
          <span>{currentLimitPrice ? parseFloat(currentLimitPrice).toFixed(8) : "0.00000000"}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Sum {baseAsset}:</span>
          <span>{form.watch("quantity") || "0.00000000"}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Sum {quoteAsset}:</span>
          <span>
            {currentLimitPrice && form.watch("quantity") 
              ? (parseFloat(currentLimitPrice) * parseFloat(form.watch("quantity") || "0")).toFixed(6)
              : "0.000000"
            }
          </span>
        </div>
      </div>
    </div>
  );
}
