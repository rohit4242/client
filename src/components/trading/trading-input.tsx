"use client";

import { Input } from "@/components/ui/input";
import { FormControl, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { cn } from "@/lib/utils";

interface TradingInputProps {
  label: string;
  sublabel?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  availableBalance?: string;
  availableAsset?: string;
  maxAction?: string;
  estimatedFee?: string;
  stepSizeHint?: string;
  disabled?: boolean;
  className?: string;
  error?: string;
}

export function TradingInput({
  label,
  sublabel,
  placeholder = "0.00000000",
  value,
  onChange,
  availableBalance,
  availableAsset,
  maxAction,
  estimatedFee,
  stepSizeHint,
  disabled = false,
  className,
  error,
}: TradingInputProps) {
  return (
    <FormItem className={cn("space-y-2", className)}>
      <FormLabel className="text-sm font-medium">
        {label}
        {sublabel && (
          <span className="text-xs text-muted-foreground ml-1">
            {sublabel}
          </span>
        )}
      </FormLabel>
      
      <FormControl>
        <div className="relative">
          <Input
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className="pr-16"
          />
          {availableAsset && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              {availableAsset}
            </div>
          )}
        </div>
      </FormControl>

      {/* Balance and action info */}
      {(availableBalance || maxAction || estimatedFee || stepSizeHint) && (
        <div className="space-y-1">
          {availableBalance && (
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Avbl</span>
              <span>{availableBalance}</span>
            </div>
          )}
          {(maxAction || estimatedFee) && (
            <div className="flex justify-between text-xs text-muted-foreground">
              {maxAction && <span>{maxAction}</span>}
              {estimatedFee && <span>Est. Fee: {estimatedFee}</span>}
            </div>
          )}
          {stepSizeHint && (
            <div className="text-xs text-muted-foreground">
              {stepSizeHint}
            </div>
          )}
        </div>
      )}

      {error && <FormMessage>{error}</FormMessage>}
    </FormItem>
  );
}
