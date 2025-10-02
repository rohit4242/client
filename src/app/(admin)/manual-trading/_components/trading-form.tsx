"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useMemo, useCallback, useEffect } from "react";
import {
  getDefaultValues,
  OrderTypeType,
  POPULAR_SYMBOLS,
  TradingFormData,
  TradingFormSchema,
} from "@/db/schema/order";
import { Exchange } from "@/types/exchange";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Optimized imports
import { useAssetData } from "@/hooks/use-asset-data";
import { useSymbolInfo } from "@/hooks/use-symbol-info";
import { AssetInfoCard } from "./asset-info-card";
import { ToggleButtonGroup } from "./toggle-button-group";
import { TradingInputMode } from "./trading-input-mode";
import { LimitOrderFields } from "./limit-order-fields";
import { extractBaseAsset } from "@/lib/utils";
import { useCreateOrder } from "@/db/actions/order/use-create-order";
import { 
  extractTradingConstraints, 
  calculateMaxBuy, 
  getConstraintMessages
} from "@/lib/trading-constraints";
import { validateOrder, ValidationError } from "@/lib/order-validation";
import { calculateOrderCost, CostBreakdown, getFeePercentageDisplay, getExpectedFeeType } from "@/lib/cost-calculator";

// Helper function to extract quote asset (e.g., USDT from BTCUSDT)
const extractQuoteAsset = (symbol: string): string => {
  const baseAsset = extractBaseAsset(symbol);
  return symbol.replace(baseAsset, "");
};

interface TradingFormProps {
  selectedExchange: Exchange | null;
  onSelectAssetsChange: (assets: string[]) => void;
  selectedAsset: string;
  userId: string;
  portfolioId?: string;
}

export function TradingForm({
  selectedExchange,
  onSelectAssetsChange,
  selectedAsset,
  userId,
  portfolioId,
}: TradingFormProps) {
  // State management
  const [orderType, setOrderType] = useState<OrderTypeType>("MARKET");
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  const [costBreakdown, setCostBreakdown] = useState<CostBreakdown | null>(null);
  const { createOrder, isPending } = useCreateOrder();

  // Optimized asset data hook with live updates
  const {
    balance,
    price,
    lastUpdate,
    isLoadingBalance,
    isLoadingPrice,
    refreshPrice,
  } = useAssetData(selectedAsset, selectedExchange, {
    livePriceConfig: { intervalMs: 1000 },
  });

  // Get separate balances for base and quote assets for better UX
  const baseAsset = extractBaseAsset(selectedAsset);
  const quoteAsset = extractQuoteAsset(selectedAsset);
  
  // Fetch base asset balance (e.g., BTC from BTCUSDT)
  const {
    balance: baseBalance,
  } = useAssetData(baseAsset + "USDT", selectedExchange, {
    livePriceConfig: { enabled: false }, // Disable live updates for balance-only
  });

  // Fetch quote asset balance (e.g., USDT from BTCUSDT)
  const {
    balance: quoteBalance,
  } = useAssetData(quoteAsset === "USDT" ? "USDTUSDT" : quoteAsset + "USDT", selectedExchange, {
    livePriceConfig: { enabled: false }, // Disable live updates for balance-only
  });

  // Symbol info for exchange filters
  const { symbolInfo, isLoading: isLoadingSymbolInfo } = useSymbolInfo({
    symbol: selectedAsset,
    exchange: selectedExchange,
  });

  // Extract trading constraints from symbol info
  const tradingConstraints = useMemo(() => 
    extractTradingConstraints(symbolInfo, selectedAsset), 
    [symbolInfo, selectedAsset]
  );

  // Calculate max buy amounts
  const maxBuyInfo = useMemo(() => {
    if (!price?.price || !baseBalance || !quoteBalance) return null;
    
    return calculateMaxBuy(
      parseFloat(quoteBalance.free || "0"),
      parseFloat(baseBalance.free || "0"),
      parseFloat(price.price),
      tradingConstraints,
      baseAsset,
      quoteAsset
    );
  }, [price, baseBalance, quoteBalance, tradingConstraints, baseAsset, quoteAsset]);

  // Get constraint messages for UI
  const constraintMessages = useMemo(() => 
    getConstraintMessages(tradingConstraints, baseAsset, quoteAsset),
    [tradingConstraints, baseAsset, quoteAsset]
  );

  // Memoized form configuration
  const form = useForm<TradingFormData>({
    resolver: zodResolver(TradingFormSchema),
    defaultValues: getDefaultValues(orderType),
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
    // Clear validation errors when order type changes
    setValidationErrors([]);
    setValidationWarnings([]);
  };

  const handleAssetChange = (value: string) => {
    onSelectAssetsChange([value]);
    form.setValue("symbol", value);
    // Clear validation errors when asset changes
    setValidationErrors([]);
    setValidationWarnings([]);
  };

  // Clear validation errors when form values change
  const clearValidationErrors = () => {
    if (validationErrors.length > 0 || validationWarnings.length > 0) {
      setValidationErrors([]);
      setValidationWarnings([]);
    }
  };

  // Calculate cost breakdown in real-time
  const updateCostBreakdown = useCallback(() => {
    const formValues = form.getValues();
    
    const cost = calculateOrderCost({
      orderData: formValues,
      currentPrice: price,
      baseAsset,
      quoteAsset,
    });
    
    setCostBreakdown(cost);
  }, [form, price, baseAsset, quoteAsset]);

  // Update cost when form values or price changes
  useEffect(() => {
    updateCostBreakdown();
  }, [updateCostBreakdown, price]);

  // Update cost when form values change
  const updateCostAndClearErrors = () => {
    clearValidationErrors();
    updateCostBreakdown();
  };

  // Helper to safely get form errors
  const getFieldError = (fieldName: string): string | undefined => {
    const errors = form.formState.errors as Record<string, { message: string }>;
    return errors[fieldName]?.message;
  };

  // Form submission handler
  const onSubmit = async (data: TradingFormData) => {
    console.log("Order data: ", data);
    
    // Clear previous validation errors
    setValidationErrors([]);
    setValidationWarnings([]);
    
    // Validate order before submission
    const validationResult = validateOrder(data, {
      baseAsset,
      quoteAsset,
      constraints: tradingConstraints,
      baseBalance,
      quoteBalance,
      currentPrice: price,
    });
    
    console.log("Validation result: ", validationResult);
    
    if (!validationResult.isValid) {
      // Set validation errors to display to user
      setValidationErrors(validationResult.errors);
      setValidationWarnings(validationResult.warnings);
      
      // Set form errors for specific fields
      validationResult.errors.forEach(error => {
        if (error.field !== "general") {
          form.setError(error.field as keyof TradingFormData, {
            type: "validation",
            message: error.message,
          });
        }
      });
      
      console.log("Order validation failed:", validationResult.errors);
      return; // Don't submit if validation fails
    }
    
    // Show warnings if any (but still allow submission)
    if (validationResult.warnings.length > 0) {
      setValidationWarnings(validationResult.warnings);
      console.log("Order warnings:", validationResult.warnings);
    }
    
    // All validation passed, create order via API
    try {
      await createOrder({
        exchange: selectedExchange!,
        order: data,
        userId,
        portfolioId: portfolioId!,
      });
      
      // Clear form and validation state on successful submission
      form.reset(getDefaultValues(orderType));
      setValidationErrors([]);
      setValidationWarnings([]);
    } catch (error) {
      console.error("Order creation failed:", error);
      // Handle API errors here if needed
    }
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

            <FormField
              control={form.control}
              name="side"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <ToggleButtonGroup
                      options={sideOptions}
                      value={field.value}
                      onChange={(value) => {
                        field.onChange(value);
                        updateCostAndClearErrors();
                      }}
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
                        updateCostAndClearErrors();
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {orderType === "LIMIT" && (
              <LimitOrderFields
                form={form}
                currentPrice={price}
                baseAsset={baseAsset}
                quoteAsset={quoteAsset}
                constraints={tradingConstraints}
                onFieldChange={updateCostAndClearErrors}
              />
            )}

            {/* Market Order Fields - Improved UI with either/or logic */}
            {orderType === "MARKET" && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="quoteOrderQty"
                  render={({ field: totalField }) => (
                    <FormField
                      control={form.control}
                      name="quantity"
                      render={({ field: amountField }) => (
                        <TradingInputMode
                          side={form.watch("side")}
                          baseAsset={baseAsset}
                          quoteAsset={quoteAsset}
                          baseBalance={baseBalance}
                          quoteBalance={quoteBalance}
                          totalValue={totalField.value}
                          amountValue={amountField.value}
                          onTotalChange={(value) => {
                            totalField.onChange(value);
                            // Clear amount when total is entered
                            if (value) amountField.onChange("");
                            // Clear validation errors and update cost
                            updateCostAndClearErrors();
                          }}
                          onAmountChange={(value) => {
                            amountField.onChange(value);
                            // Clear total when amount is entered
                            if (value) totalField.onChange("");
                            // Clear validation errors and update cost
                            updateCostAndClearErrors();
                          }}
                          maxBuyInfo={maxBuyInfo}
                          constraintMessages={constraintMessages}
                          totalError={getFieldError("quoteOrderQty")}
                          amountError={getFieldError("quantity")}
                        />
                      )}
                    />
                  )}
                />
              </div>
            )}

            {/* Risk Management Section */}
            {/* <ExpandableSection title="Risk Management">
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
            </ExpandableSection> */}

            {/* Advanced Options Section */}
            {/* <ExpandableSection title="Advanced Options">
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
            </ExpandableSection> */}

            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <div className="space-y-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-destructive rounded-full flex items-center justify-center">
                    <span className="text-xs text-destructive-foreground">!</span>
                  </div>
                  <span className="text-sm font-medium text-destructive">Order Validation Failed</span>
                </div>
                <div className="space-y-1">
                  {validationErrors.map((error, index) => (
                    <div key={index} className="text-xs text-destructive">
                      • {error.message}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Validation Warnings */}
            {validationWarnings.length > 0 && (
              <div className="space-y-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white">⚠</span>
                  </div>
                  <span className="text-sm font-medium text-yellow-800">Warnings</span>
                </div>
                <div className="space-y-1">
                  {validationWarnings.map((warning, index) => (
                    <div key={index} className="text-xs text-yellow-700">
                      • {warning}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Estimated Cost Breakdown */}
            {costBreakdown && (
              <div className="space-y-3 py-4 border-t border-border">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Cost Breakdown</span>
                  <span className="text-xs text-muted-foreground">
                    {getFeePercentageDisplay(costBreakdown.tradingFeeRate)} fee
                  </span>
                </div>
                
                <div className="space-y-2 text-sm">
                  {/* Quantity and Price */}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {costBreakdown.side === "BUY" ? "Buying" : "Selling"}:
                    </span>
                    <span>{costBreakdown.quantity.toFixed(8)} {baseAsset}</span>
                  </div>
                  
                  {costBreakdown.side === "BUY" && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">At price:</span>
                      <span>{costBreakdown.price.toFixed(2)} {quoteAsset}</span>
                    </div>
                  )}
                  
                  {/* Subtotal */}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {costBreakdown.side === "BUY" ? "Order value:" : "Gross amount:"}
                    </span>
                    <span>{costBreakdown.formattedSubtotal}</span>
                  </div>
                  
                  {/* Trading Fee */}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Trading fee:</span>
                    <span className="text-destructive">-{costBreakdown.formattedFee}</span>
                  </div>
                  
                  {/* Fee explanation */}
                  <div className="text-xs text-muted-foreground">
                    {getExpectedFeeType(form.getValues(), price).description}
                  </div>
                </div>
                
                {/* Total/Net Amount */}
                <div className="pt-2 border-t border-border">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">
                      {costBreakdown.side === "BUY" ? "Total Cost:" : "Net Received:"}
                    </span>
                    <span className="text-lg font-bold">
                      {costBreakdown.formattedTotal}
                    </span>
                  </div>
                  
                  {costBreakdown.side === "BUY" && (
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>You will receive:</span>
                      <span>~{costBreakdown.netReceived.toFixed(8)} {baseAsset}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* No cost breakdown available */}
            {!costBreakdown && (
              <div className="space-y-2 py-3 border-t border-border">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Estimated Cost:</span>
                  <span className="text-sm text-muted-foreground">Enter order details</span>
                </div>
              </div>
            )}

            {/* Exchange Info Loading */}
            {isLoadingSymbolInfo && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                Loading exchange filters...
              </div>
            )}

            {/* Enhanced Submit Button */}
            <Button
              type="submit"
              className={`w-full h-12 text-base font-semibold ${
                form.watch("side") === "BUY"
                  ? "bg-teal-600 hover:bg-teal-700"
                  : "bg-rose-600 hover:bg-rose-700"
              }`}
              disabled={!selectedExchange || isPending || isLoadingSymbolInfo}
            >
              {isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                <div className="flex flex-col items-center">
                  <span>{`${form.watch("side") === "BUY" ? "Buy" : "Sell"} ${extractBaseAsset(selectedAsset)}`}</span>
                </div>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
