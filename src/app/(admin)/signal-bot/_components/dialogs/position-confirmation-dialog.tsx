"use client";

import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  TrendingUp, 
  TrendingDown, 
  Bot, 
  Info,
  CheckCircle2,
  XCircle 
} from "lucide-react";

import { SignalBot } from "@/types/signal-bot";
import { useLivePrice } from "@/hooks/use-live-price";

interface PositionConfirmationDialogProps {
  bot: SignalBot;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function PositionConfirmationDialog({ 
  bot, 
  open, 
  onOpenChange, 
  onSuccess 
}: PositionConfirmationDialogProps) {
  const [selectedSide, setSelectedSide] = useState<"Long" | "Short" | null>(null);
  const [isCreatingPosition, setIsCreatingPosition] = useState(false);
  const [fallbackPrice, setFallbackPrice] = useState<number | null>(null);
  const [isFetchingFallback, setIsFetchingFallback] = useState(false);

  // Get live price for the first symbol (could be enhanced to handle multiple symbols)
  const primarySymbol = bot.symbols[0] || "BTCUSDT";
  const { price: currentPrice, isUpdating: priceLoading } = useLivePrice(primarySymbol);

  // Fallback: Fetch price from API if WebSocket fails or takes too long
  useEffect(() => {
    if (!open) return;
    
    // If still loading after 3 seconds, fetch from API as fallback
    const fallbackTimer = setTimeout(async () => {
      if (!currentPrice && !isFetchingFallback) {
        console.log('⚠️ WebSocket price not available, fetching from API...');
        setIsFetchingFallback(true);
        try {
          const response = await axios.get(`/api/trading/price/${primarySymbol}`);
          if (response.data?.price) {
            setFallbackPrice(parseFloat(response.data.price));
            console.log('✅ Fallback price fetched:', response.data.price);
          }
        } catch (error) {
          console.error('❌ Failed to fetch fallback price:', error);
        } finally {
          setIsFetchingFallback(false);
        }
      }
    }, 3000);

    return () => clearTimeout(fallbackTimer);
  }, [open, currentPrice, primarySymbol, isFetchingFallback]);

  // Use WebSocket price if available, otherwise use fallback
  const displayPrice = currentPrice || fallbackPrice;
  const isLoading = priceLoading && !displayPrice && !isFetchingFallback;

  const createPositionMutation = useMutation({
    mutationFn: async (side: "Long" | "Short") => {
      const response = await axios.post(`/api/signal-bots/${bot.id}/position`, {
        side,
        symbol: primarySymbol,
      });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Position created successfully!");
      setSelectedSide(null);
      onSuccess();
      onOpenChange(false);
    },
    onError: (error: AxiosError<{ error: string }>) => {
      toast.error(error.response?.data?.error || "Failed to create position");
    },
    onSettled: () => {
      setIsCreatingPosition(false);
    },
  });

  const handleCreatePosition = (side: "Long" | "Short") => {
    setSelectedSide(side);
    setIsCreatingPosition(true);
    createPositionMutation.mutate(side);
  };

  const handleSkip = () => {
    onOpenChange(false);
    onSuccess();
  };

  // Calculate potential position details
  // Use exchange totalValue if available, otherwise fallback to placeholder
  const portfolioValue = bot.exchange?.totalValue ? parseFloat(bot.exchange.totalValue.toString()) : 10000;
  const positionValue = (portfolioValue * bot.portfolioPercent) / 100;
  const quantity = displayPrice ? positionValue / displayPrice : 0;

  // Calculate stop loss and take profit prices
  const stopLossPrice = displayPrice && bot.stopLoss ? {
    long: displayPrice * (1 - bot.stopLoss / 100),
    short: displayPrice * (1 + bot.stopLoss / 100),
  } : null;

  const takeProfitPrice = displayPrice && bot.takeProfit ? {
    long: displayPrice * (1 + bot.takeProfit / 100),
    short: displayPrice * (1 - bot.takeProfit / 100),
  } : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <span>Bot Created Successfully!</span>
          </DialogTitle>
          <DialogDescription>
            Your signal bot &quot;{bot.name}&quot; has been created. Would you like to take an immediate position?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Bot Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-lg">
                <Bot className="h-5 w-5" />
                <span>Bot Configuration</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Symbol:</span>
                  <Badge variant="outline" className="ml-2">{primarySymbol}</Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">Portfolio %:</span>
                  <span className="ml-2 font-medium">{bot.portfolioPercent}%</span>
                </div>
                {bot.stopLoss && (
                  <div>
                    <span className="text-muted-foreground">Stop Loss:</span>
                    <span className="ml-2 font-medium text-red-600">{bot.stopLoss}%</span>
                  </div>
                )}
                {bot.takeProfit && (
                  <div>
                    <span className="text-muted-foreground">Take Profit:</span>
                    <span className="ml-2 font-medium text-green-600">{bot.takeProfit}%</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Current Market Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-lg">
                <Info className="h-5 w-5" />
                <span>Current Market</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Current Price:</span>
                  <span className="ml-2 font-mono font-medium">
                    {isLoading ? (
                      <span className="text-muted-foreground">Loading...</span>
                    ) : displayPrice ? (
                      <>
                        ${displayPrice.toFixed(4)}
                        {fallbackPrice && !currentPrice && (
                          <Badge variant="outline" className="ml-2 text-xs">API</Badge>
                        )}
                      </>
                    ) : (
                      <span className="text-destructive">N/A</span>
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Position Size:</span>
                  <span className="ml-2 font-medium">
                    {quantity > 0 ? `${quantity.toFixed(6)} ${primarySymbol.replace('USDT', '')}` : "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Position Value:</span>
                  <span className="ml-2 font-medium">${positionValue.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Position Options */}
          <div className="space-y-4">
            <h4 className="font-medium">Choose Position Direction</h4>
            
            <div className="grid grid-cols-2 gap-4">
              {/* Long Position Card */}
              <Card 
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedSide === "Long" ? "border-green-500 bg-green-50 dark:bg-green-950" : ""
                }`}
                onClick={() => !isCreatingPosition && handleCreatePosition("Long")}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center space-x-2 text-green-600">
                    <TrendingUp className="h-5 w-5" />
                    <span>LONG</span>
                  </CardTitle>
                  <CardDescription>
                    Buy {primarySymbol.replace('USDT', '')} expecting price to rise
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Entry:</span>
                    <span className="font-mono">${displayPrice?.toFixed(4) || "N/A"}</span>
                  </div>
                  {stopLossPrice && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Stop Loss:</span>
                      <span className="font-mono text-red-600">${stopLossPrice.long.toFixed(4)}</span>
                    </div>
                  )}
                  {takeProfitPrice && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Take Profit:</span>
                      <span className="font-mono text-green-600">${takeProfitPrice.long.toFixed(4)}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Short Position Card */}
              <Card 
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedSide === "Short" ? "border-red-500 bg-red-50 dark:bg-red-950" : ""
                }`}
                onClick={() => !isCreatingPosition && handleCreatePosition("Short")}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center space-x-2 text-red-600">
                    <TrendingDown className="h-5 w-5" />
                    <span>SHORT</span>
                  </CardTitle>
                  <CardDescription>
                    Sell {primarySymbol.replace('USDT', '')} expecting price to fall
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Entry:</span>
                    <span className="font-mono">${displayPrice?.toFixed(4) || "N/A"}</span>
                  </div>
                  {stopLossPrice && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Stop Loss:</span>
                      <span className="font-mono text-red-600">${stopLossPrice.short.toFixed(4)}</span>
                    </div>
                  )}
                  {takeProfitPrice && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Take Profit:</span>
                      <span className="font-mono text-green-600">${takeProfitPrice.short.toFixed(4)}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          <Separator />

          {/* Action Buttons */}
          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={handleSkip}
              disabled={isCreatingPosition}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Skip for Now
            </Button>
            
            <div className="text-xs text-muted-foreground max-w-md">
              You can always create positions manually later through the bot management interface.
            </div>
          </div>

          {isCreatingPosition && (
            <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              <span>Creating {selectedSide} position...</span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
