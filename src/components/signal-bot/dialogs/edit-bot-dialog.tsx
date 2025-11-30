"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, TrendingUp, Wallet, Loader2, AlertTriangle, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";

import {
  updateSignalBotSchema,
  UpdateSignalBotData,
  SIGNAL_BOT_SYMBOLS,
  ORDER_TYPE_OPTIONS,
  ACCOUNT_TYPE_OPTIONS,
  SIDE_EFFECT_TYPE_OPTIONS,
  TRADE_AMOUNT_TYPE_OPTIONS
} from "@/db/schema/signal-bot";
import { SignalBot } from "@/types/signal-bot";
import { Exchange } from "@/types/exchange";
import { useLivePrice } from "@/hooks/trading/use-live-price";
import { useTradeValidation } from "@/hooks/signal-bot/use-trade-validation";

interface EditSignalBotDialogProps {
  bot: SignalBot;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface MaxBorrowData {
  asset: string;
  maxBorrowable: string;
  currentBorrowed: string;
  interest: string;
  totalOwed: string;
}

export function EditSignalBotDialog({ bot, open, onOpenChange, onSuccess }: EditSignalBotDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    resolver: zodResolver(updateSignalBotSchema),
    defaultValues: {
      name: bot.name,
      description: bot.description || "",
      exchangeId: bot.exchangeId,
      symbols: bot.symbols,
      orderType: bot.orderType as "Market" | "Limit",
      tradeAmount: bot.tradeAmount || 100,
      tradeAmountType: (bot.tradeAmountType || "QUOTE") as "QUOTE" | "BASE",
      leverage: bot.leverage || 1,
      accountType: (bot.accountType || "SPOT") as "SPOT" | "MARGIN",
      marginType: "CROSS" as const,
      sideEffectType: (bot.sideEffectType || "NO_SIDE_EFFECT") as "NO_SIDE_EFFECT" | "MARGIN_BUY" | "AUTO_REPAY" | "AUTO_BORROW_REPAY",
      autoRepay: bot.autoRepay || false,
      maxBorrowPercent: bot.maxBorrowPercent || 50,
      stopLoss: bot.stopLoss,
      takeProfit: bot.takeProfit,
    },
  });

  const watchedExchangeId = form.watch("exchangeId");
  const watchedAccountType = form.watch("accountType");
  const watchedTradeAmount = form.watch("tradeAmount");
  const watchedTradeAmountType = form.watch("tradeAmountType");
  const watchedLeverage = form.watch("leverage");
  const watchedSymbols = form.watch("symbols");

  // Reset form when bot changes
  useEffect(() => {
    form.reset({
      name: bot.name,
      description: bot.description || "",
      exchangeId: bot.exchangeId,
      symbols: bot.symbols,
      orderType: bot.orderType as "Market" | "Limit",
      tradeAmount: bot.tradeAmount || 100,
      tradeAmountType: (bot.tradeAmountType || "QUOTE") as "QUOTE" | "BASE",
      leverage: bot.leverage || 1,
      accountType: (bot.accountType || "SPOT") as "SPOT" | "MARGIN",
      marginType: "CROSS" as const,
      sideEffectType: (bot.sideEffectType || "NO_SIDE_EFFECT") as "NO_SIDE_EFFECT" | "MARGIN_BUY" | "AUTO_REPAY" | "AUTO_BORROW_REPAY",
      autoRepay: bot.autoRepay || false,
      maxBorrowPercent: bot.maxBorrowPercent || 50,
      stopLoss: bot.stopLoss,
      takeProfit: bot.takeProfit,
    });
  }, [bot, form]);

  // Fetch exchanges for the dropdown
  const { data: exchanges = [] } = useQuery<Exchange[]>({
    queryKey: ["exchanges"],
    queryFn: async () => {
      const response = await axios.get("/api/exchanges");
      return response.data;
    },
    enabled: open,
  });

  const activeExchanges = useMemo(() =>
    exchanges.filter(exchange => exchange.isActive),
    [exchanges]
  );

  const selectedExchange = useMemo(() =>
    activeExchanges.find(e => e.id === watchedExchangeId) || bot.exchange,
    [activeExchanges, watchedExchangeId, bot.exchange]
  );

  // Fetch max borrowable amount when margin is selected
  const { data: maxBorrowData, isLoading: isLoadingMaxBorrow } = useQuery<{ data: MaxBorrowData }>({
    queryKey: ["maxBorrow", selectedExchange?.id, "USDT"],
    queryFn: async () => {
      if (!selectedExchange) throw new Error("No exchange selected");
      const response = await axios.post("/api/margin/max-borrow", {
        asset: "USDT",
        apiKey: selectedExchange.apiKey,
        apiSecret: selectedExchange.apiSecret,
      });
      return response.data;
    },
    enabled: open && watchedAccountType === "MARGIN" && !!selectedExchange?.apiKey,
    staleTime: 30000,
  });

  const updateBotMutation = useMutation({
    mutationFn: async (data: UpdateSignalBotData) => {
      const response = await axios.put(`/api/signal-bots/${bot.id}`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Signal bot updated successfully!");
      onSuccess();
    },
    onError: (error: AxiosError<{ error: string }>) => {
      toast.error(error.response?.data?.error || "Failed to update signal bot");
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const onSubmit = (data: UpdateSignalBotData) => {
    // Validate that we have a valid formatted quantity
    if (!validationResult?.valid || !validationResult.formattedQuantity) {
      toast.error("Please fix validation errors before updating bot");
      return;
    }

    setIsSubmitting(true);

    // Override with formatted values
    const formattedData: UpdateSignalBotData = {
      ...data,
      tradeAmount: validationResult.formattedQuantity,
      tradeAmountType: "BASE", // Always BASE after formatting
    };

    updateBotMutation.mutate(formattedData);
  };

  // Extract base and quote assets from symbol
  const extractAssets = (symbol: string) => {
    const quoteAssets = ['USDT', 'BUSD', 'USDC'];
    for (const quote of quoteAssets) {
      if (symbol.endsWith(quote)) {
        return { baseAsset: symbol.slice(0, -quote.length), quoteAsset: quote };
      }
    }
    return { baseAsset: symbol.slice(0, -4), quoteAsset: symbol.slice(-4) };
  };

  const selectedSymbol = watchedSymbols?.[0] || "BTCUSDT";
  const { baseAsset, quoteAsset } = extractAssets(selectedSymbol);

  // Get live price for real-time conversion
  const { price: currentPrice, isUpdating: isPriceLoading } = useLivePrice(selectedSymbol);

  // Trade amount validation
  const { data: validationResult, isLoading: isValidating } = useTradeValidation({
    symbol: selectedSymbol,
    tradeAmount: watchedTradeAmount || 0,
    tradeAmountType: watchedTradeAmountType || "QUOTE",
    exchangeId: watchedExchangeId || "",
    enabled: open && !!watchedExchangeId && (watchedTradeAmount || 0) > 0,
  });


  // Calculate trading values with fixed amount and real-time price conversion
  const tradingCalculations = useMemo(() => {
    if (!selectedExchange) return null;

    const spotValue = selectedExchange.spotValue || 0;
    const marginValue = selectedExchange.marginValue || 0;
    const activeValue = watchedAccountType === "SPOT" ? spotValue : marginValue;
    const tradeAmount = watchedTradeAmount || 0;
    const leverage = watchedLeverage || 1;
    const isQuoteType = watchedTradeAmountType === "QUOTE";
    const price = currentPrice || 0;

    // Calculate USDT equivalent (always needed for balance check)
    const usdtValue = isQuoteType
      ? tradeAmount
      : tradeAmount * price;

    // Calculate BASE equivalent (for display)
    const baseValue = isQuoteType
      ? (price > 0 ? tradeAmount / price : 0)
      : tradeAmount;

    // Position value is always in USDT for calculations
    const positionValue = usdtValue;
    const leveragedValue = positionValue * leverage;
    const borrowAmount = leveragedValue - positionValue;

    const maxBorrowable = maxBorrowData?.data?.maxBorrowable
      ? parseFloat(maxBorrowData.data.maxBorrowable)
      : 0;

    const originalAccountType = bot.accountType || "SPOT";
    const accountTypeChanged = watchedAccountType !== originalAccountType;

    // Check if balance is sufficient - always compare against USDT value
    const hasSufficientBalance = activeValue >= usdtValue;
    const hasSufficientWithBorrow = watchedAccountType === "MARGIN"
      ? (activeValue + maxBorrowable) >= leveragedValue
      : hasSufficientBalance;

    return {
      spotValue,
      marginValue,
      activeValue,
      positionValue,
      leveragedValue,
      borrowAmount,
      maxBorrowable,
      currentBorrowed: maxBorrowData?.data?.currentBorrowed
        ? parseFloat(maxBorrowData.data.currentBorrowed)
        : 0,
      exceedsMaxBorrow: borrowAmount > maxBorrowable && watchedAccountType === "MARGIN" && leverage > 1,
      accountTypeChanged,
      hasSufficientBalance,
      hasSufficientWithBorrow,
      // New fields for conversion display
      usdtValue,
      baseValue,
      currentPrice: price,
      hasPrice: price > 0,
    };
  }, [selectedExchange, watchedAccountType, watchedTradeAmount, watchedTradeAmountType, watchedLeverage, maxBorrowData, bot.accountType, currentPrice]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Signal Bot</DialogTitle>
          <DialogDescription>
            Update your bot configuration and settings.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="basic" className="flex items-center space-x-1">
                  <TrendingUp className="h-4 w-4" />
                  <span>Basic Settings</span>
                </TabsTrigger>
                <TabsTrigger value="risk" className="flex items-center space-x-1">
                  <Shield className="h-4 w-4" />
                  <span>Risk Management</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Bot Configuration</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bot Name</FormLabel>
                          <FormControl>
                            <Input placeholder="My Trading Bot" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description (Optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Describe your trading strategy..."
                              {...field}
                              rows={2}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="exchangeId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Exchange</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select exchange" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {activeExchanges.map((exchange) => (
                                  <SelectItem key={exchange.id} value={exchange.id}>
                                    {exchange.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="symbols"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Trading Symbol</FormLabel>
                            <Select
                              onValueChange={(value) => field.onChange([value])}
                              value={field.value?.[0] || ""}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select pair" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {SIGNAL_BOT_SYMBOLS.map((symbol) => (
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
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="orderType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Order Type</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {ORDER_TYPE_OPTIONS.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="accountType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Account Type</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select account" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {ACCOUNT_TYPE_OPTIONS.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Trading Amount Card */}
                <Card className="border-2 border-primary/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Wallet className="h-4 w-4" />
                      Trading Amount
                    </CardTitle>
                    <CardDescription>
                      Specify the exact amount to trade per signal
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Amount Type Toggle + Live Price Row */}
                    <div className="flex items-start justify-between gap-4">
                      <FormField
                        control={form.control}
                        name="tradeAmountType"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <div className="flex rounded-lg border p-1 bg-muted/30">
                              {TRADE_AMOUNT_TYPE_OPTIONS.map((option) => (
                                <button
                                  key={option.value}
                                  type="button"
                                  className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${field.value === option.value
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                                    }`}
                                  onClick={() => field.onChange(option.value)}
                                >
                                  {option.value === "QUOTE" ? quoteAsset : baseAsset}
                                </button>
                              ))}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Live Price Display */}
                      <div className="text-right shrink-0">
                        <p className="text-xs text-muted-foreground">{baseAsset} Price</p>
                        <div className="flex items-center gap-1 justify-end">
                          {isPriceLoading ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <TrendingUp className="h-3 w-3 text-green-500" />
                          )}
                          <span className="font-mono font-semibold text-sm">
                            ${currentPrice?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '-.--'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Amount Input + Conversion Preview */}
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="tradeAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">
                              Amount in {watchedTradeAmountType === "QUOTE" ? quoteAsset : baseAsset}
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                step={watchedTradeAmountType === "QUOTE" ? "1" : "0.000001"}
                                placeholder={watchedTradeAmountType === "QUOTE" ? "100" : "0.00001"}
                                className="font-mono"
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Real-time Conversion Preview */}
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">You&apos;ll Trade</p>
                        {tradingCalculations?.hasPrice ? (
                          <div className="rounded-md border bg-muted/30 p-2.5 h-10 flex items-center">
                            <div className="text-sm">
                              {watchedTradeAmountType === "QUOTE" ? (
                                <span className="font-mono">
                                  <span className="text-muted-foreground">≈</span>{" "}
                                  <span className="font-semibold">{tradingCalculations.baseValue.toFixed(6)}</span>{" "}
                                  <span className="text-muted-foreground">{baseAsset}</span>
                                </span>
                              ) : (
                                <span className="font-mono">
                                  <span className="text-muted-foreground">≈</span>{" "}
                                  <span className="font-semibold">${tradingCalculations.usdtValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="rounded-md border bg-muted/30 p-2.5 h-10 flex items-center">
                            <span className="text-xs text-muted-foreground">Waiting for price...</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Leverage */}
                    <FormField
                      control={form.control}
                      name="leverage"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center justify-between">
                            <FormLabel className="text-xs">Leverage</FormLabel>
                            <span className="text-xs text-muted-foreground">
                              {watchedAccountType === "SPOT" ? "Spot (no leverage)" : "1x to 10x"}
                            </span>
                          </div>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              max={watchedAccountType === "MARGIN" ? 10 : 1}
                              className="font-mono"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : 1)}
                              value={field.value || 1}
                              disabled={watchedAccountType === "SPOT"}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Balance Validation Panel */}
                    {selectedExchange && tradingCalculations && (
                      <div className="rounded-lg border bg-card p-4 space-y-3">
                        {/* Status Header */}
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Balance Check</span>
                          {tradingCalculations.hasSufficientWithBorrow ? (
                            <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                              ✓ Sufficient
                            </span>
                          ) : (
                            <span className="text-xs font-medium px-2 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                              ✗ Insufficient
                            </span>
                          )}
                        </div>

                        {/* Balance Comparison */}
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="rounded-md bg-muted/50 p-2.5">
                            <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                              Available ({watchedAccountType})
                              {tradingCalculations.accountTypeChanged && (
                                <Badge variant="outline" className="text-[10px] px-1 py-0 border-amber-300 text-amber-700">
                                  Changed
                                </Badge>
                              )}
                            </p>
                            <p className="font-mono font-medium">
                              ${tradingCalculations.activeValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                          </div>
                          <div className="rounded-md bg-muted/50 p-2.5">
                            <p className="text-xs text-muted-foreground mb-1">Required Amount</p>
                            <p className={`font-mono font-medium ${!tradingCalculations.hasSufficientBalance ? 'text-red-600' : ''}`}>
                              ${tradingCalculations.usdtValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                            {watchedTradeAmountType === "BASE" && tradingCalculations.hasPrice && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                ({watchedTradeAmount} {baseAsset})
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Leveraged Position Details */}
                        {watchedLeverage && watchedLeverage > 1 && (
                          <div className="border-t pt-3 space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">
                                Total Position ({watchedLeverage}x):
                              </span>
                              <span className="font-mono font-semibold">
                                ${tradingCalculations.leveragedValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">To Borrow:</span>
                              <span className="font-mono text-amber-600">
                                ${tradingCalculations.borrowAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Max Borrowable for Margin */}
                        {watchedAccountType === "MARGIN" && (
                          <div className="border-t pt-3 space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                Max Borrowable:
                              </span>
                              {isLoadingMaxBorrow ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <span className="font-mono font-medium text-green-600">
                                  ${tradingCalculations.maxBorrowable.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              )}
                            </div>
                            {tradingCalculations.currentBorrowed > 0 && (
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Currently Borrowed:</span>
                                <span className="font-mono text-amber-600">
                                  ${tradingCalculations.currentBorrowed.toFixed(2)}
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Warnings */}
                        {!tradingCalculations.hasSufficientBalance && watchedAccountType === "SPOT" && (
                          <div className="flex items-start gap-2 text-red-600 text-xs bg-red-50 dark:bg-red-950/50 p-2 rounded">
                            <AlertTriangle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                            <span>Insufficient balance. Reduce amount or switch to margin trading.</span>
                          </div>
                        )}

                        {tradingCalculations.exceedsMaxBorrow && (
                          <div className="flex items-start gap-2 text-red-600 text-xs bg-red-50 dark:bg-red-950/50 p-2 rounded">
                            <AlertTriangle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                            <span>Exceeds borrowing limit. Reduce leverage or trade amount.</span>
                          </div>
                        )}

                        {tradingCalculations.accountTypeChanged && (
                          <div className="flex items-start gap-2 text-amber-600 text-xs bg-amber-50 dark:bg-amber-950/50 p-2 rounded">
                            <AlertTriangle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                            <span>Changing account type will affect which portfolio balance is used.</span>
                          </div>
                        )}

                        {!tradingCalculations.hasPrice && (
                          <div className="flex items-start gap-2 text-amber-600 text-xs bg-amber-50 dark:bg-amber-950/50 p-2 rounded">
                            <AlertTriangle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                            <span>Waiting for live price to calculate accurate values...</span>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Trading Constraints Validation */}
                {validationResult && (
                  <Card className={`border-2 ${validationResult.valid ? 'border-green-500/20' : 'border-red-500/20'}`}>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        {validationResult.valid ? (
                          <span className="text-green-600">✓ Validated Trade Amount</span>
                        ) : (
                          <span className="text-red-600">✗ Invalid Trade Amount</span>
                        )}
                      </CardTitle>
                      <CardDescription>
                        Binance trading constraints applied
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* Formatted Quantity Display */}
                      <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">You Entered:</span>
                          <span className="font-mono">
                            {watchedTradeAmount} {watchedTradeAmountType === "QUOTE" ? quoteAsset : baseAsset}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Bot Will Trade:</span>
                          <span className="font-mono font-bold text-green-600">
                            {validationResult.formattedQuantity?.toFixed(8)} {baseAsset}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Notional Value:</span>
                          <span className="font-mono">
                            ${validationResult.notionalValue?.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Constraints Info */}
                      {validationResult.constraints && (
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="rounded bg-muted/50 p-2">
                            <p className="text-muted-foreground mb-1">Min Quantity</p>
                            <p className="font-mono">{validationResult.constraints.minQty}</p>
                          </div>
                          <div className="rounded bg-muted/50 p-2">
                            <p className="text-muted-foreground mb-1">Step Size</p>
                            <p className="font-mono">{validationResult.constraints.stepSize}</p>
                          </div>
                          <div className="rounded bg-muted/50 p-2">
                            <p className="text-muted-foreground mb-1">Min Notional</p>
                            <p className="font-mono">${validationResult.constraints.minNotional}</p>
                          </div>
                          <div className="rounded bg-muted/50 p-2">
                            <p className="text-muted-foreground mb-1">Current Price</p>
                            <p className="font-mono">${validationResult.currentPrice?.toFixed(2)}</p>
                          </div>
                        </div>
                      )}

                      {/* Errors */}
                      {validationResult.errors && validationResult.errors.length > 0 && (
                        <div className="space-y-1">
                          {validationResult.errors.map((error, index) => (
                            <div key={index} className="flex items-start gap-2 text-red-600 text-xs bg-red-50 dark:bg-red-950/50 p-2 rounded">
                              <AlertTriangle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                              <span>{error}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Warnings */}
                      {validationResult.warnings && validationResult.warnings.length > 0 && (
                        <div className="space-y-1">
                          {validationResult.warnings.map((warning, index) => (
                            <div key={index} className="flex items-start gap-2 text-amber-600 text-xs bg-amber-50 dark:bg-amber-950/50 p-2 rounded">
                              <AlertTriangle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                              <span>{warning}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {isValidating && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Validating trade amount...</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Margin Settings */}
                {watchedAccountType === "MARGIN" && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Margin Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="sideEffectType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Side Effect Type</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select side effect type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {SIDE_EFFECT_TYPE_OPTIONS.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    <div className="flex flex-col">
                                      <span>{option.label}</span>
                                      <span className="text-xs text-muted-foreground">{option.description}</span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="autoRepay"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                              <div className="space-y-0.5">
                                <FormLabel className="text-sm">Auto Repay</FormLabel>
                                <FormDescription className="text-xs">
                                  Repay debt on close
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="maxBorrowPercent"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Max Borrow %</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="1"
                                  max="100"
                                  {...field}
                                  onChange={(e) => field.onChange(Number(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="bg-amber-50 dark:bg-amber-950/50 p-3 rounded-lg">
                        <div className="flex items-start space-x-2">
                          <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                          <div className="text-xs text-amber-700 dark:text-amber-300">
                            <p className="font-medium">Margin Trading Warning</p>
                            <p className="mt-1">Borrowed assets accrue interest hourly. Only use margin if you understand the risks.</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="risk" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Risk Management</CardTitle>
                    <CardDescription>
                      Set automatic stop loss and take profit levels to manage your risk.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="stopLoss"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Stop Loss (%)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.1"
                                min="0.1"
                                max="50"
                                {...field}
                                onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                                value={field.value || ""}
                                placeholder="e.g., 2.0"
                              />
                            </FormControl>
                            <FormDescription>
                              Automatic stop loss to limit losses.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="takeProfit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Take Profit (%)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.1"
                                min="0.1"
                                max="100"
                                {...field}
                                onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                                value={field.value || ""}
                                placeholder="e.g., 4.0"
                              />
                            </FormControl>
                            <FormDescription>
                              Automatic take profit to secure gains.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-950/50 p-4 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                        <div className="text-sm">
                          <p className="font-medium text-blue-900 dark:text-blue-100">Risk Management Tips</p>
                          <ul className="text-blue-700 dark:text-blue-300 mt-1 space-y-1 text-xs">
                            <li>• Use a 1:2 risk-reward ratio (e.g., 2% SL, 4% TP)</li>
                            <li>• Never risk more than 2-5% of your portfolio per trade</li>
                            <li>• Always set stop loss to protect your capital</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <Separator />

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !tradingCalculations?.hasSufficientWithBorrow || !validationResult?.valid}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Bot"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
