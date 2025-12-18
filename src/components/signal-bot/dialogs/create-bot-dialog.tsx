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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Bot, TrendingUp, Shield, Wallet, Loader2, AlertTriangle, DollarSign, ArrowRight, Activity, Percent } from "lucide-react";

import {
  createSignalBotSchema,
  CreateSignalBotData,
  SIGNAL_BOT_SYMBOLS,
  ORDER_TYPE_OPTIONS,
  ACCOUNT_TYPE_OPTIONS,
  SIDE_EFFECT_TYPE_OPTIONS,
  TRADE_AMOUNT_TYPE_OPTIONS
} from "@/db/schema/signal-bot";
import { Exchange } from "@/types/exchange";
import { SignalBot } from "@/types/signal-bot";
import { PositionConfirmationDialog } from "@/app/(admin)/signal-bot/_components/dialogs/position-confirmation-dialog";
import { useLivePrice } from "@/hooks/trading/use-live-price";
import { useTradeValidation } from "@/hooks/signal-bot/use-trade-validation";

interface CreateSignalBotDialogProps {
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

export function CreateSignalBotDialog({ open, onOpenChange, onSuccess }: CreateSignalBotDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdBot, setCreatedBot] = useState<SignalBot | null>(null);
  const [showPositionDialog, setShowPositionDialog] = useState(false);

  const form = useForm({
    resolver: zodResolver(createSignalBotSchema),
    defaultValues: {
      name: "",
      description: "",
      exchangeId: "",
      symbols: ["BTCUSDT"],
      orderType: "Market" as const,
      tradeAmount: 100,
      tradeAmountType: "QUOTE" as const,
      leverage: 1,
      accountType: "SPOT" as const,
      marginType: "CROSS" as const,
      sideEffectType: "NO_SIDE_EFFECT" as const,
      autoRepay: false,
      maxBorrowPercent: 50,
      stopLoss: null,
      takeProfit: null,
    },
  });

  const watchedExchangeId = form.watch("exchangeId");
  const watchedAccountType = form.watch("accountType");
  const watchedTradeAmount = form.watch("tradeAmount");
  const watchedTradeAmountType = form.watch("tradeAmountType");
  const watchedLeverage = form.watch("leverage");
  const watchedSymbols = form.watch("symbols");
  const watchedMaxBorrowPercent = form.watch("maxBorrowPercent");

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
    activeExchanges.find(e => e.id === watchedExchangeId),
    [activeExchanges, watchedExchangeId]
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
    enabled: open && watchedAccountType === "MARGIN" && !!selectedExchange,
    staleTime: 30000, // Cache for 30 seconds
  });

  const createBotMutation = useMutation({
    mutationFn: async (data: CreateSignalBotData) => {
      const response = await axios.post("/api/signal-bots", data);
      return response.data;
    },
    onSuccess: (data: SignalBot) => {
      toast.success("Signal bot created successfully!");
      form.reset();
      setCreatedBot(data);
      onOpenChange(false);
      setShowPositionDialog(true);
    },
    onError: (error: AxiosError<{ error: string }>) => {
      toast.error(error.response?.data?.error || "Failed to create signal bot");
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const onSubmit = (data: CreateSignalBotData) => {
    // Validate that we have a valid formatted quantity
    if (!validationResult?.valid || !validationResult.formattedQuantity) {
      toast.error("Please fix validation errors before creating bot");
      return;
    }

    setIsSubmitting(true);

    // Override with formatted values
    const formattedData: CreateSignalBotData = {
      ...data,
      tradeAmount: validationResult.formattedQuantity,
      tradeAmountType: "BASE", // Always BASE after formatting
    };

    createBotMutation.mutate(formattedData);
  };

  const handlePositionDialogComplete = () => {
    setShowPositionDialog(false);
    setCreatedBot(null);
    onSuccess();
  };

  // Extract base and quote assets from symbol
  const extractAssets = (symbol: string) => {
    const quoteAssets = ['USDT', 'FDUSD', 'BUSD', 'USDC'];
    for (const quote of quoteAssets) {
      if (symbol.endsWith(quote)) {
        return { baseAsset: symbol.slice(0, -quote.length), quoteAsset: quote };
      }
    }
    return { baseAsset: symbol.slice(0, -5), quoteAsset: symbol.slice(-5) };
  };

  const selectedSymbol = watchedSymbols?.[0] || "BTCFDUSD";
  const { baseAsset, quoteAsset } = extractAssets(selectedSymbol);

  // Get live price for real-time conversion
  const { price: currentPrice, isUpdating: isPriceLoading } = useLivePrice(selectedSymbol);

  // Trade amount validation
  const { data: validationResult, isLoading: isValidating } = useTradeValidation({
    symbol: selectedSymbol,
    tradeAmount: watchedTradeAmount || 0,
    tradeAmountType: watchedTradeAmountType || "QUOTE",
    exchangeId: watchedExchangeId,
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

    // Rename for clarity
    const exchangeMaxBorrowable = maxBorrowData?.data?.maxBorrowable
      ? parseFloat(maxBorrowData.data.maxBorrowable)
      : 0;

    // Calculate user limit based on percentage
    const userMaxBorrowable = exchangeMaxBorrowable * ((watchedMaxBorrowPercent || 0) / 100);

    // For Spot: Must have full position value
    // For Margin: Can use balance + borrow to cover position
    const hasSufficientBalance = activeValue >= usdtValue;
    const totalBuyingPower = watchedAccountType === "MARGIN"
      ? activeValue + userMaxBorrowable
      : activeValue;
    const hasSufficientWithBorrow = watchedAccountType === "MARGIN"
      ? totalBuyingPower >= leveragedValue
      : hasSufficientBalance;

    return {
      spotValue,
      marginValue,
      activeValue,
      positionValue,
      leveragedValue,
      borrowAmount,
      exchangeMaxBorrowable,
      userMaxBorrowable,
      totalBuyingPower,
      currentBorrowed: maxBorrowData?.data?.currentBorrowed
        ? parseFloat(maxBorrowData.data.currentBorrowed)
        : 0,
      exceedsMaxBorrow: borrowAmount > userMaxBorrowable && watchedAccountType === "MARGIN" && leverage > 1,
      hasSufficientBalance,
      hasSufficientWithBorrow,
      // New fields for conversion display
      usdtValue,
      baseValue,
      currentPrice: price,
      hasPrice: price > 0,
    };
  }, [selectedExchange, watchedAccountType, watchedTradeAmount, watchedTradeAmountType, watchedLeverage, maxBorrowData, currentPrice, watchedMaxBorrowPercent]);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Bot className="h-5 w-5" />
              <span>Create Signal Bot</span>
            </DialogTitle>
            <DialogDescription>
              Set up a trading bot that responds to TradingView signals.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="basic" className="flex items-center space-x-1">
                    <TrendingUp className="h-4 w-4" />
                    <span>Basic Setup</span>
                  </TabsTrigger>
                  <TabsTrigger value="risk" className="flex items-center space-x-1">
                    <Shield className="h-4 w-4" />
                    <span>Risk Management</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4">
                  <Card>
                    <CardHeader className="pb-4 border-b bg-muted/10">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Bot className="h-5 w-5 text-primary" />
                        Bot Configuration
                      </CardTitle>
                      <CardDescription>
                        Configure your bot&apos;s identity and trading preferences
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5 pt-6">
                      <div className="grid grid-cols-1 gap-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Bot Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="My BTC Strategy" {...field} className="bg-background" />
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
                                  <Input placeholder="Trend following strategy..." {...field} className="bg-background" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="exchangeId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Exchange</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="bg-background">
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
                                <FormLabel>Trading Pair</FormLabel>
                                <Select
                                  onValueChange={(value) => field.onChange([value])}
                                  value={field.value?.[0] || ""}
                                >
                                  <FormControl>
                                    <SelectTrigger className="bg-background">
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
                                    <SelectTrigger className="bg-background">
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
                                    <SelectTrigger className="bg-background">
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
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-primary/20 shadow-md">
                    <CardHeader className="border-b">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <Wallet className="h-5 w-5 text-primary" />
                            Position & Leverage
                          </CardTitle>
                          <CardDescription>
                            Configure your trade size and risk parameters
                          </CardDescription>
                        </div>
                        {currentPrice && (
                          <Badge variant="outline" className="text-xs font-mono bg-background">
                            1 {baseAsset} ≈ ${currentPrice.toFixed(2)}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-5 pt-6">

                      {/* Trade Amount Input */}
                      <FormField
                        control={form.control}
                        name="tradeAmount"
                        render={({ field: { value, ...fieldProps } }) => (
                          <FormItem className="space-y-3">
                            <div className="flex justify-between items-center">
                              <FormLabel>Trade Amount</FormLabel>
                              <div className="text-right text-xs text-muted-foreground">
                                {tradingCalculations?.hasPrice && (
                                  <span>
                                    ≈ {watchedTradeAmountType === "QUOTE"
                                      ? `${tradingCalculations.baseValue.toFixed(6)} ${baseAsset}`
                                      : `$${tradingCalculations.usdtValue.toFixed(2)}`
                                    }
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <div className="relative flex-1">
                                <Input
                                  type="number"
                                  placeholder="0.00"
                                  className="h-11 text-lg font-mono pl-4 pr-32"
                                  step={watchedTradeAmountType === "QUOTE" ? "1" : "0.00001"}
                                  {...fieldProps}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    fieldProps.onChange(val === "" ? "" : Number(val));
                                  }}
                                  value={value ?? ""}
                                />
                                <div className="absolute top-1 right-1 bottom-1 bg-muted/50 rounded-md p-1 flex">
                                  {TRADE_AMOUNT_TYPE_OPTIONS.map((option) => (
                                    <button
                                      key={option.value}
                                      type="button"
                                      onClick={() => form.setValue("tradeAmountType", option.value as any)}
                                      className={`px-3 text-xs font-medium rounded-sm transition-all ${watchedTradeAmountType === option.value
                                        ? "bg-background text-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"
                                        }`}
                                    >
                                      {option.value === "QUOTE" ? quoteAsset : baseAsset}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Separator />

                      {/* Leverage Slider */}
                      <FormField
                        control={form.control}
                        name="leverage"
                        render={({ field }) => (
                          <FormItem className="space-y-4">
                            <div className="flex justify-between items-center">
                              <FormLabel>Leverage</FormLabel>
                              <Badge variant="secondary" className="font-mono text-sm px-2">
                                {field.value}x
                              </Badge>
                            </div>
                            <FormControl>
                              <div className="flex items-center gap-4">
                                <span className="text-xs text-muted-foreground w-4">1x</span>
                                <Slider
                                  min={1}
                                  max={watchedAccountType === "MARGIN" ? 10 : 1}
                                  step={1}
                                  value={[field.value || 1]}
                                  onValueChange={(vals) => field.onChange(vals[0])}
                                  disabled={watchedAccountType === "SPOT"}
                                  className="flex-1"
                                />
                                <span className="text-xs text-muted-foreground w-6 text-right">
                                  {watchedAccountType === "MARGIN" ? "10x" : "1x"}
                                </span>
                              </div>
                            </FormControl>
                            <FormDescription>
                              {watchedAccountType === "SPOT"
                                ? "Spot trading does not use leverage."
                                : "Adjust leverage for margin trading."}
                            </FormDescription>
                          </FormItem>
                        )}
                      />

                      {/* Max Borrow Settings (Margin Only) */}
                      {watchedAccountType === "MARGIN" && (
                        <div className="rounded-lg border bg-muted/20 p-4 space-y-4">
                          <div className="flex items-center justify-between">
                            <FormLabel className="flex items-center gap-2">
                              Max Borrow Limit
                              <Badge variant="outline" className="text-[10px] h-5">Risk Control</Badge>
                            </FormLabel>
                            <div className="flex gap-2">
                              {[25, 50, 75, 100].map((pct) => (
                                <Button
                                  key={pct}
                                  type="button"
                                  variant={watchedMaxBorrowPercent === pct ? "secondary" : "outline"}
                                  size="sm"
                                  className="h-7 text-xs"
                                  onClick={() => form.setValue("maxBorrowPercent", pct)}
                                >
                                  {pct}%
                                </Button>
                              ))}
                            </div>
                          </div>

                          <FormField
                            control={form.control}
                            name="maxBorrowPercent"
                            render={({ field }) => (
                              <FormItem className="space-y-0">
                                <FormControl>
                                  <div className="flex items-center gap-4">
                                    <Slider
                                      min={0}
                                      max={100}
                                      step={5}
                                      value={[field.value || 50]}
                                      onValueChange={(vals) => field.onChange(vals[0])}
                                      className="flex-1"
                                    />
                                    <div className="flex items-center relative w-16">
                                      <Input
                                        {...field}
                                        className="h-8 pr-6 text-right font-mono text-xs"
                                        onChange={e => field.onChange(Number(e.target.value))}
                                      />
                                      <span className="absolute right-2 text-xs text-muted-foreground">%</span>
                                    </div>
                                  </div>
                                </FormControl>
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="sideEffectType"
                            render={({ field }) => (
                              <FormItem>
                                <div className="flex items-center justify-between mb-2">
                                  <FormLabel className="text-xs">Side Effect</FormLabel>
                                </div>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="h-8 text-xs bg-background">
                                      <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {SIDE_EFFECT_TYPE_OPTIONS.map((option) => (
                                      <SelectItem key={option.value} value={option.value}>
                                        <span className="text-xs">{option.label}</span>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </FormItem>
                            )}
                          />
                        </div>
                      )}

                      {/* Trade Preview & Balance Check */}
                      {selectedExchange && tradingCalculations && (
                        <div className="rounded-xl border bg-card p-0 overflow-hidden shadow-sm">
                          <div className="bg-muted/30 px-4 py-3 flex items-center justify-between border-b">
                            <h4 className="font-medium text-sm flex items-center gap-2">
                              <Activity className="h-4 w-4 text-primary" />
                              Trade Simulation
                            </h4>
                            {tradingCalculations.hasSufficientWithBorrow ? (
                              <div className="flex items-center gap-1.5 text-green-600 text-[10px] font-bold uppercase tracking-wide">
                                <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                                Specifics OK
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 text-red-600 text-[10px] font-bold uppercase tracking-wide">
                                <div className="h-1.5 w-1.5 rounded-full bg-red-500" />
                                Insufficient Funds
                              </div>
                            )}
                          </div>

                          <div className="p-4 space-y-5">
                            {/* Buying Power Usage */}
                            <div className="space-y-2">
                              <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Buying Power Usage</span>
                                <span className="font-mono font-medium">
                                  {tradingCalculations.totalBuyingPower > 0
                                    ? Math.min(100, (tradingCalculations.leveragedValue / tradingCalculations.totalBuyingPower * 100)).toFixed(1)
                                    : 0}%
                                </span>
                              </div>
                              <Progress
                                value={tradingCalculations.totalBuyingPower > 0
                                  ? (tradingCalculations.leveragedValue / tradingCalculations.totalBuyingPower * 100)
                                  : 0}
                                className="h-2"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm">
                              <div className="space-y-0.5">
                                <span className="text-muted-foreground text-[10px] uppercase tracking-wider">Required Margin</span>
                                <div className="font-mono font-medium flex items-baseline gap-1">
                                  <span>${tradingCalculations.usdtValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                              </div>

                              <div className="space-y-0.5 text-right">
                                <span className="text-muted-foreground text-[10px] uppercase tracking-wider">Total Buying Power</span>
                                <div className="font-mono font-medium flex items-baseline justify-end gap-1">
                                  <span>${tradingCalculations.totalBuyingPower.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                              </div>

                              {watchedAccountType === "MARGIN" && (
                                <>
                                  <div className="col-span-2 pt-2 border-t grid grid-cols-2 gap-4">
                                    <div className="space-y-0.5">
                                      <span className="text-muted-foreground text-[10px] uppercase tracking-wider flex items-center gap-1">
                                        Max Borrowable
                                        <Badge variant="secondary" className="text-[9px] h-4 px-1">{watchedMaxBorrowPercent}%</Badge>
                                      </span>
                                      <div className="font-mono font-medium text-green-600">
                                        ${tradingCalculations.userMaxBorrowable.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </div>
                                      <div className="text-[10px] text-muted-foreground">
                                        Exchange Limit: ${tradingCalculations.exchangeMaxBorrowable.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                      </div>
                                    </div>
                                    <div className="space-y-0.5 text-right">
                                      <span className="text-muted-foreground text-[10px] uppercase tracking-wider">To Borrow</span>
                                      <div className="font-mono font-medium text-amber-600">
                                        ${tradingCalculations.borrowAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </div>
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>

                            {/* Alert Box for Issues */}
                            {(!tradingCalculations.hasSufficientWithBorrow || tradingCalculations.exceedsMaxBorrow) && (
                              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-lg p-3 flex items-start gap-3">
                                <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                                <div className="space-y-1">
                                  <p className="text-xs font-medium text-red-900 dark:text-red-200">Trade Validation Failed</p>
                                  <p className="text-xs text-red-700 dark:text-red-300">
                                    {tradingCalculations.exceedsMaxBorrow
                                      ? "Borrowed amount exceeds your configured limit. Lower leverage or trade size."
                                      : "Insufficient balance to cover the required margin."}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
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


                </TabsContent>

                <TabsContent value="risk" className="space-y-4">
                  <Card>
                    <CardHeader className="pb-4 border-b bg-muted/10">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Shield className="h-5 w-5 text-primary" />
                        Risk Management
                      </CardTitle>
                      <CardDescription>
                        Set automatic stop loss and take profit levels to protect your capital.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5 pt-6">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="stopLoss"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Stop Loss</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input
                                    type="number"
                                    step="0.1"
                                    min="0.1"
                                    max="50"
                                    className="pr-6 font-mono"
                                    {...field}
                                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                                    value={field.value || ""}
                                    placeholder="2.0"
                                  />
                                  <span className="absolute right-2.5 top-2.5 text-xs text-muted-foreground">%</span>
                                </div>
                              </FormControl>
                              <FormDescription>
                                Trigger stop loss at this % drop
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
                              <FormLabel>Take Profit</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input
                                    type="number"
                                    step="0.1"
                                    min="0.1"
                                    max="100"
                                    className="pr-6 font-mono"
                                    {...field}
                                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                                    value={field.value || ""}
                                    placeholder="4.0"
                                  />
                                  <span className="absolute right-2.5 top-2.5 text-xs text-muted-foreground">%</span>
                                </div>
                              </FormControl>
                              <FormDescription>
                                Trigger take profit at this % gain
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/50 p-4 rounded-lg">
                        <div className="flex items-start space-x-3">
                          <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                          <div className="text-sm">
                            <p className="font-medium text-blue-900 dark:text-blue-100">Risk Management Tips</p>
                            <ul className="text-blue-700 dark:text-blue-300 mt-2 space-y-1.5 text-xs">
                              <li className="flex items-center gap-1.5">
                                <div className="h-1 w-1 rounded-full bg-blue-500" />
                                Use a 1:2 risk-reward ratio (e.g., 2% SL, 4% TP)
                              </li>
                              <li className="flex items-center gap-1.5">
                                <div className="h-1 w-1 rounded-full bg-blue-500" />
                                Never risk more than 2-5% of your portfolio per trade
                              </li>
                              <li className="flex items-center gap-1.5">
                                <div className="h-1 w-1 rounded-full bg-blue-500" />
                                Always set stop loss to protect your capital
                              </li>
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
                  disabled={isSubmitting || !tradingCalculations?.hasSufficientWithBorrow}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Bot"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog >

      {/* Position Confirmation Dialog */}
      {
        createdBot && (
          <PositionConfirmationDialog
            bot={createdBot}
            open={showPositionDialog}
            onOpenChange={setShowPositionDialog}
            onSuccess={handlePositionDialogComplete}
          />
        )
      }
    </>
  );
}
