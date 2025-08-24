"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useMemo } from "react";
import {
  getDefaultValues,
  OrderTypeType,
  POPULAR_SYMBOLS,
  TradingFormData,
  TradingFormSchema,
} from "@/db/schema/order";
import { Exchange } from "@/db/schema/exchange";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FormControl,
  FormField,
  FormItem,
  Form,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Optimized imports
import { useAssetData } from "@/hooks/use-asset-data";
import { useTradingCalculations } from "@/hooks/use-trading-calculations";
import { AssetInfoCard } from "./asset-info-card";
import { ToggleButtonGroup } from "./toggle-button-group";
import { PercentageButtons } from "./percentage-buttons";
import { ExpandableSection } from "./expandable-section";
import { extractBaseAsset } from "@/lib/utils";
import { useCreateOrder } from "@/db/actions/order/use-create-order";

interface TradingFormProps {
  selectedExchange: Exchange | null;
  onSelectAssetsChange: (assets: string[]) => void;
  selectedAsset: string;
}

export function TradingForm({
  selectedExchange,
  onSelectAssetsChange,
  selectedAsset,
}: TradingFormProps) {
  // State management
  const [orderType, setOrderType] = useState<OrderTypeType>("MARKET");
  const { createOrder, isPending } = useCreateOrder();

  // Optimized asset data hook with live updates
  const {
    balance,
    price,
    lastUpdate,
    isLoadingBalance,
    isLoadingPrice,
    refreshPrice,
    error,
  } = useAssetData(selectedAsset, selectedExchange, {
    livePriceConfig: { intervalMs: 1000 },
  });

  // Memoized form configuration
  const form = useForm<TradingFormData>({
    resolver: zodResolver(TradingFormSchema),
    defaultValues: getDefaultValues(orderType),
  });

  // Trading calculations hook
  const {
    maxQuantity,
    handlePercentageSelect,
    canTrade,
    estimatedCost,
    formattedCost,
    tradingFee,
    totalCost,
    side,
    error: calculationError,
  } = useTradingCalculations({
    balance,
    price,
    form,
    feeRate: 0.001, // 0.1% trading fee
  });

  // Memoized toggle options
  const sideOptions = useMemo(
    () => [
      { value: "BUY", label: "Buy", variant: "success" as const },
      { value: "SELL", label: "Sell", variant: "danger" as const },
    ],
    []
  );

  const typeOptions = useMemo(
    () => [
      { value: "MARKET", label: "Market", variant: "default" as const },
      { value: "LIMIT", label: "Limit", variant: "default" as const },
    ],
    []
  );

  // Optimized event handlers
  const handleOrderTypeChange = (value: OrderTypeType) => {
    setOrderType(value);
    form.reset(getDefaultValues(value));
  };

  const handleAssetChange = (value: string) => {
    onSelectAssetsChange([value]);
    form.setValue("symbol", value);
  };

  // Form submission handler
  const onSubmit = async (data: TradingFormData) => {
    console.log("Form submitted:", {
      formData: data,
      calculations: {
        maxQuantity,
        estimatedCost,
        tradingFee,
        totalCost,
        isValid: canTrade,
      },
      market: {
        symbol: selectedAsset,
        currentPrice: price?.price,
        side,
      },
      exchange: selectedExchange,
    });
    // Create order via API
    createOrder({
      exchange: selectedExchange!,
      order: data,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trading Form</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
            {/* Symbol Selection */}
            <FormField
              control={form.control}
              name="symbol"
              render={() => (
                <FormItem>
                  <FormLabel>Asset</FormLabel>
                  <Select
                    onValueChange={handleAssetChange}
                    value={selectedAsset}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select asset" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {POPULAR_SYMBOLS.map((symbol) => (
                        <SelectItem key={symbol} value={symbol}>
                          {symbol}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Asset Info Card - Balance & Price Display */}
            {selectedAsset && (
              <AssetInfoCard
                symbol={selectedAsset}
                balance={balance}
                price={price}
                lastUpdate={lastUpdate}
                isLoadingBalance={isLoadingBalance}
                isLoadingPrice={isLoadingPrice}
                onRefreshPrice={refreshPrice}
                selectedExchange={!!selectedExchange}
              />
            )}

            {/* Error Display */}
            {(error || calculationError) && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-3">
                <div className="text-sm text-rose-600">
                  {error || calculationError}
                </div>
              </div>
            )}

            <FormField
              control={form.control}
              name="side"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <ToggleButtonGroup
                      options={sideOptions}
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <ToggleButtonGroup
                      options={typeOptions}
                      value={field.value}
                      onChange={(value) => {
                        field.onChange(value);
                        handleOrderTypeChange(value as OrderTypeType);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {orderType === "LIMIT" && (
              <>
                <FormField
                  control={form.control}
                  name="timeInForce"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time in Force</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select time in force" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="GTC">
                            Good &apos;til Cancelled
                          </SelectItem>
                          <SelectItem value="IOC">
                            Immediate or Cancel
                          </SelectItem>
                          <SelectItem value="FOK">Fill or Kill</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="10000" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="1" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {/* Quantity Field for Market Orders */}
            {orderType === "MARKET" && (
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Quantity ({extractBaseAsset(selectedAsset)})
                    </FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="0.0000" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Percentage Buttons */}
            {maxQuantity > 0 && (
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground">
                  Quick Select (Max: {maxQuantity.toFixed(8)}{" "}
                  {extractBaseAsset(selectedAsset)})
                </div>
                <PercentageButtons
                  onPercentageSelect={handlePercentageSelect}
                />
              </div>
            )}

            {/* Risk Management Section */}
            <ExpandableSection title="Risk Management">
              <div className="space-y-4 mt-4">
                <div className="text-sm text-muted-foreground">
                  Set stop-loss and take-profit levels to manage your risk.
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">
                      Stop Loss
                    </label>
                    <Input placeholder="0.00" className="mt-1" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">
                      Take Profit
                    </label>
                    <Input placeholder="0.00" className="mt-1" />
                  </div>
                </div>
              </div>
            </ExpandableSection>

            {/* Advanced Options Section */}
            <ExpandableSection title="Advanced Options">
              <div className="space-y-4 mt-4">
                <div className="text-sm text-muted-foreground">
                  Configure advanced trading parameters.
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">
                      Slippage Tolerance
                    </label>
                    <Input placeholder="0.5%" className="mt-1" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">
                      Order Timeout
                    </label>
                    <Input placeholder="5 minutes" className="mt-1" />
                  </div>
                </div>
              </div>
            </ExpandableSection>

            {/* Estimated Cost Breakdown */}
            <div className="space-y-2 py-3 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Estimated Cost:</span>
                <span className="text-lg font-bold">{formattedCost}</span>
              </div>

              {tradingFee > 0 && (
                <>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Trading Fee (0.1%):</span>
                    <span>${tradingFee.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm font-medium border-t pt-2">
                    <span>Total Cost:</span>
                    <span>${totalCost.toFixed(2)}</span>
                  </div>
                </>
              )}
            </div>

            {/* Enhanced Submit Button */}
            <Button
              type="submit"
              className={`w-full h-12 text-base font-semibold ${
                side === "BUY"
                  ? "bg-teal-600 hover:bg-teal-700"
                  : "bg-rose-600 hover:bg-rose-700"
              }`}
              disabled={!canTrade || !selectedExchange || isPending}
            >
              {isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                `${side === "BUY" ? "BUY" : "SELL"} ${selectedAsset}`
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
