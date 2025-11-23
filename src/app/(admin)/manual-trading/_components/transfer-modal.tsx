"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useTransfer } from "@/hooks/use-margin-operations";
import { useMarginAccount } from "@/hooks/use-margin-account";
import { getAsset } from "@/db/actions/assets/get-asset";
import { BORROWABLE_ASSETS } from "@/lib/margin-constants";
import { ArrowRight, Loader2 } from "lucide-react";
import { Exchange } from "@/types/exchange";
import { useQuery } from "@tanstack/react-query";
import { formatAssetAmount } from "@/lib/margin-utils";

interface TransferModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exchange?: Exchange;
}

export function TransferModal({
  open,
  onOpenChange,
  exchange,
}: TransferModalProps) {
  const [direction, setDirection] = useState<"toMargin" | "toSpot">("toMargin");
  const [asset, setAsset] = useState<string>("USDT");
  const [amount, setAmount] = useState<string>("");

  const transferMutation = useTransfer(exchange as Exchange);

  // Fetch spot balance when transferring from Spot (toMargin)
  const { data: spotBalanceData, isLoading: isLoadingSpot } = useQuery({
    queryKey: ["spotBalance", asset, exchange?.id, direction],
    queryFn: async () => {
      if (!exchange || direction !== "toMargin") return null;
      // Create a symbol like "USDTUSDT" or "BTCUSDT" to fetch balance
      const symbol = asset === "USDT" ? "USDTUSDT" : `${asset}USDT`;
      return await getAsset(symbol, exchange);
    },
    enabled: open && direction === "toMargin" && !!exchange && !!asset,
    staleTime: 5000,
  });

  // Fetch margin balance when transferring from Margin (toSpot)
  const { data: marginAccountData, isLoading: isLoadingMargin } = useMarginAccount(
    exchange as Exchange,
    open && direction === "toSpot" && !!exchange
  );

  // Calculate available balance based on direction
  const availableBalance = useMemo(() => {
    if (direction === "toMargin") {
      // Transferring from Spot - use spot balance
      const balance = spotBalanceData?.asset;
      if (!balance) return "0";
      return balance.free || "0";
    } else {
      // Transferring from Margin - use margin balance
      const marginAssets = marginAccountData?.data?.userAssets || [];
      const marginAsset = marginAssets.find((a) => a.asset === asset);
      if (!marginAsset) return "0";
      return marginAsset.free || "0";
    }
  }, [direction, spotBalanceData, marginAccountData, asset]);

  const isLoadingBalance = direction === "toMargin" ? isLoadingSpot : isLoadingMargin;
  const maxAmount = parseFloat(availableBalance) || 0;

  // Reset amount when direction or asset changes
  useEffect(() => {
    setAmount("");
  }, [direction, asset]);

  const handleMaxClick = () => {
    if (maxAmount > 0) {
      setAmount(maxAmount.toString());
    }
  };

  const handleTransfer = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      return;
    }

    const transferAmount = parseFloat(amount);
    if (transferAmount > maxAmount) {
      return;
    }

    await transferMutation.mutateAsync({
      asset,
      amount,
      direction,
    });

    // Reset form on success
    setAmount("");
    onOpenChange(false);
  };

  const isLoading = transferMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Transfer Assets</DialogTitle>
          <DialogDescription>
            Move funds between your spot and margin accounts
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Direction Selection */}
          <div className="space-y-3">
            <Label>Transfer Direction</Label>
            <RadioGroup
              value={direction}
              onValueChange={(v) => setDirection(v as "toMargin" | "toSpot")}
              className="space-y-3"
            >
              <div className="flex items-center space-x-3 border rounded-lg p-3 cursor-pointer hover:bg-accent">
                <RadioGroupItem value="toMargin" id="toMargin" />
                <Label
                  htmlFor="toMargin"
                  className="flex items-center gap-2 cursor-pointer flex-1"
                >
                  <span className="font-medium">Spot</span>
                  <ArrowRight className="h-4 w-4" />
                  <span className="font-medium">Margin</span>
                </Label>
              </div>
              <div className="flex items-center space-x-3 border rounded-lg p-3 cursor-pointer hover:bg-accent">
                <RadioGroupItem value="toSpot" id="toSpot" />
                <Label
                  htmlFor="toSpot"
                  className="flex items-center gap-2 cursor-pointer flex-1"
                >
                  <span className="font-medium">Margin</span>
                  <ArrowRight className="h-4 w-4" />
                  <span className="font-medium">Spot</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Asset Selection */}
          <div className="space-y-2">
            <Label htmlFor="transfer-asset">Asset</Label>
            <Select value={asset} onValueChange={setAsset}>
              <SelectTrigger id="transfer-asset">
                <SelectValue placeholder="Select asset" />
              </SelectTrigger>
              <SelectContent>
                {BORROWABLE_ASSETS.map((assetOption) => (
                  <SelectItem key={assetOption} value={assetOption}>
                    {assetOption}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="transfer-amount">Amount</Label>
            <div className="relative">
              <Input
                id="transfer-amount"
                type="number"
                step="any"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={isLoading || isLoadingBalance}
                className="pr-16"
              />
              <Button
                variant="secondary"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-7"
                onClick={handleMaxClick}
                disabled={isLoading || isLoadingBalance || maxAmount <= 0}
              >
                Max
              </Button>
            </div>
            <div className="flex items-center justify-between text-xs">
              <p className="text-muted-foreground">
                {isLoadingBalance ? (
                  <span className="flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Loading balance...
                  </span>
                ) : (
                  <>
                    Available:{" "}
                    <span className="font-medium text-foreground">
                      {formatAssetAmount(availableBalance)} {asset}
                    </span>
                  </>
                )}
              </p>
              {parseFloat(amount) > maxAmount && (
                <p className="text-destructive font-medium">
                  Amount exceeds available balance
                </p>
              )}
            </div>
          </div>

          {/* Info Box */}
          <div className="p-3 bg-muted rounded-md text-sm">
            <p className="text-muted-foreground">
              {direction === "toMargin" ? (
                <>
                  Transferring from <strong>Spot</strong> to{" "}
                  <strong>Margin</strong> account
                </>
              ) : (
                <>
                  Transferring from <strong>Margin</strong> to{" "}
                  <strong>Spot</strong> account
                </>
              )}
            </p>
          </div>

          {/* Action Button */}
          <Button
            onClick={handleTransfer}
            disabled={
              !amount ||
              parseFloat(amount) <= 0 ||
              isLoading ||
              isLoadingBalance ||
              parseFloat(amount) > maxAmount
            }
            className="w-full"
          >
            {transferMutation.isPending ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Transferring...
              </span>
            ) : (
              `Transfer ${amount || "0"} ${asset}`
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

