"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { useBorrow, useRepay, useMaxBorrow } from "@/hooks/trading/use-margin-operations";
import { BORROWABLE_ASSETS } from "@/lib/margin/margin-constants";
import { AlertTriangle, Loader2, Info, Wallet, ArrowRightLeft } from "lucide-react";
import { formatAssetAmount } from "@/lib/margin/margin-utils";
import { Exchange } from "@/types/exchange";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { MarginAsset } from "@/types/margin";

interface BorrowRepayModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exchange?: Exchange;
}

export function BorrowRepayModal({
  open,
  onOpenChange,
  exchange,
}: BorrowRepayModalProps) {
  const [tab, setTab] = useState<"borrow" | "repay">("borrow");
  const [asset, setAsset] = useState<string>("USDT");
  const [amount, setAmount] = useState<string>("");

  const borrowMutation = useBorrow(exchange as Exchange);
  const repayMutation = useRepay(exchange as Exchange);
  
  // Fetch max borrow data when modal is open (for both borrow and repay tabs)
  const { data: maxBorrowData, isLoading: isLoadingMax } = useMaxBorrow(
    asset,
    exchange as Exchange,
    open && !!exchange
  );

  // Fetch margin account balance when on repay tab
  const { data: marginAccountData, isLoading: isLoadingAccount } = useQuery({
    queryKey: ['marginAccount', exchange?.id],
    queryFn: async () => {
      const response = await axios.post('/api/margin/account', {
        apiKey: exchange?.apiKey,
        apiSecret: exchange?.apiSecret,
      });
      return response.data;
    },
    enabled: open && tab === 'repay' && !!exchange,
    staleTime: 5000,
  });

  // Reset amount when asset changes
  useEffect(() => {
    setAmount("");
  }, [asset]);

  const handleBorrow = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      return;
    }

    await borrowMutation.mutateAsync({ asset, amount });

    // Reset form on success
    setAmount("");
    onOpenChange(false);
  };

  const handleRepay = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      return;
    }

    await repayMutation.mutateAsync({
      asset,
      amount,
    });

    // Reset form on success
    setAmount("");
    onOpenChange(false);
  };

  const handleMaxBorrow = () => {
    if (maxBorrowData?.success && maxBorrowData.data.maxBorrowable) {
      // Format to 8 decimal places to avoid floating point issues
      const maxAmount = parseFloat(maxBorrowData.data.maxBorrowable);
      const formatted = maxAmount.toFixed(8);
      // Remove trailing zeros
      setAmount(parseFloat(formatted).toString());
    }
  };

  const handleMaxRepay = () => {
    if (maxBorrowData?.success && maxBorrowData.data.totalOwed) {
      // Format to 8 decimal places to avoid floating point issues
      const totalOwed = parseFloat(maxBorrowData.data.totalOwed);
      const formatted = totalOwed.toFixed(8);
      // Remove trailing zeros
      setAmount(parseFloat(formatted).toString());
    }
  };

  const isLoading = borrowMutation.isPending || repayMutation.isPending;
  
  const maxBorrowable = maxBorrowData?.data?.maxBorrowable 
    ? parseFloat(maxBorrowData.data.maxBorrowable) 
    : 0;
  const currentBorrowed = maxBorrowData?.data?.currentBorrowed 
    ? parseFloat(maxBorrowData.data.currentBorrowed) 
    : 0;
  const interest = maxBorrowData?.data?.interest 
    ? parseFloat(maxBorrowData.data.interest) 
    : 0;
  const totalOwed = maxBorrowData?.data?.totalOwed 
    ? parseFloat(maxBorrowData.data.totalOwed) 
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Borrow & Repay</DialogTitle>
          <DialogDescription>
            Manage your margin account by borrowing or repaying assets
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as "borrow" | "repay")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="borrow">Borrow</TabsTrigger>
            <TabsTrigger value="repay">Repay</TabsTrigger>
          </TabsList>

          <TabsContent value="borrow" className="space-y-4 mt-4">
            {/* Warning */}
            <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-yellow-800">
                  Borrowing Risk
                </p>
                <p className="text-xs text-yellow-700">
                  Interest accrues hourly on borrowed amounts. Repay loans promptly
                  to avoid liquidation.
                </p>
              </div>
            </div>

            {/* Asset Selection */}
            <div className="space-y-2">
              <Label htmlFor="borrow-asset">Asset</Label>
              <Select value={asset} onValueChange={setAsset}>
                <SelectTrigger id="borrow-asset">
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

            {/* Max Borrow Info */}
            {isLoadingMax ? (
              <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">
                  Loading borrow limits...
                </span>
              </div>
            ) : maxBorrowData?.success && (
              <div className="space-y-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div className="flex-1 space-y-1">
                    <p className="text-xs font-medium text-blue-800">
                      Borrow Limits
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs text-blue-700">
                      <div className="flex justify-between">
                        <span>Max Borrow:</span>
                        <span className="font-semibold">
                          {formatAssetAmount(maxBorrowable, asset === 'USDT' ? 2 : 8)} {asset}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Current Debt:</span>
                        <span className="font-semibold">
                          {formatAssetAmount(currentBorrowed, asset === 'USDT' ? 2 : 8)} {asset}
                        </span>
                      </div>
                      {interest > 0 && (
                        <div className="flex justify-between col-span-2">
                          <span>Accrued Interest:</span>
                          <span className="font-semibold text-orange-600">
                            {formatAssetAmount(interest, asset === 'USDT' ? 2 : 8)} {asset}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Amount Input with Max Button */}
            <div className="space-y-2">
              <Label htmlFor="borrow-amount">Amount</Label>
              <div className="flex gap-2">
                <Input
                  id="borrow-amount"
                  type="number"
                  step="any"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleMaxBorrow}
                  disabled={isLoading || !maxBorrowData?.success || maxBorrowable <= 0}
                >
                  Max
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Enter the amount you want to borrow
              </p>
            </div>

            {/* Action Button */}
            <Button
              onClick={handleBorrow}
              disabled={!amount || parseFloat(amount) <= 0 || isLoading}
              className="w-full"
            >
              {borrowMutation.isPending ? "Borrowing..." : `Borrow ${asset}`}
            </Button>
          </TabsContent>

          <TabsContent value="repay" className="space-y-4 mt-4">
            {/* Info */}
            <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="space-y-1">
                <p className="text-sm font-medium text-blue-800">
                  Repay Borrowed Assets
                </p>
                <p className="text-xs text-blue-700">
                  Repay your loans to reduce interest and improve your margin level.
                </p>
              </div>
            </div>

            {/* Asset Selection */}
            <div className="space-y-2">
              <Label htmlFor="repay-asset">Asset</Label>
              <Select value={asset} onValueChange={setAsset}>
                <SelectTrigger id="repay-asset">
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

            {/* Debt Info */}
            {isLoadingMax ? (
              <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">
                  Loading debt information...
                </span>
              </div>
            ) : maxBorrowData?.success && totalOwed > 0 && (
              <div className="space-y-2 p-3 bg-orange-50 border border-orange-200 rounded-md">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5" />
                  <div className="flex-1 space-y-1">
                    <p className="text-xs font-medium text-orange-800">
                      Current Debt
                    </p>
                    <div className="space-y-1 text-xs text-orange-700">
                      <div className="flex justify-between">
                        <span>Borrowed:</span>
                        <span className="font-semibold">
                          {formatAssetAmount(currentBorrowed, asset === 'USDT' ? 2 : 8)} {asset}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Interest:</span>
                        <span className="font-semibold">
                          {formatAssetAmount(interest, asset === 'USDT' ? 2 : 8)} {asset}
                        </span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-orange-300">
                        <span className="font-medium">Total Owed:</span>
                        <span className="font-bold">
                          {formatAssetAmount(totalOwed, asset === 'USDT' ? 2 : 8)} {asset}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {maxBorrowData?.success && totalOwed === 0 && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md text-center">
                <p className="text-sm text-green-800">
                  No debt for {asset}
                </p>
              </div>
            )}

            {/* Amount Input with Max Button */}
            <div className="space-y-2">
              <Label htmlFor="repay-amount">Amount</Label>
              <div className="flex gap-2">
                <Input
                  id="repay-amount"
                  type="number"
                  step="any"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleMaxRepay}
                  disabled={isLoading || !maxBorrowData?.success || totalOwed <= 0}
                >
                  Max
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Enter the amount you want to repay
              </p>
            </div>

            {/* Available Assets for Repayment */}
            {isLoadingAccount ? (
              <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">
                  Loading margin account assets...
                </span>
              </div>
            ) : marginAccountData?.success && marginAccountData.data?.userAssets && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                  <ArrowRightLeft className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  <p className="text-xs font-medium text-blue-800">
                    Available Assets for Repayment
                  </p>
                </div>
                <div className="max-h-32 overflow-y-auto space-y-1 p-2 bg-muted/30 rounded-md">
                  {marginAccountData.data.userAssets
                    .filter((userAsset: MarginAsset) => parseFloat(userAsset.free) > 0)
                    .map((userAsset: MarginAsset) => (
                      <div 
                        key={userAsset.asset} 
                        className="flex items-center justify-between text-xs p-1.5 hover:bg-muted rounded"
                      >
                        <div className="flex items-center gap-2">
                          <Wallet className="h-3 w-3 text-muted-foreground" />
                          <span className="font-medium">{userAsset.asset}</span>
                        </div>
                        <span className="font-mono text-muted-foreground">
                          {parseFloat(userAsset.free).toFixed(8)}
                        </span>
                      </div>
                    ))}
                  {marginAccountData.data.userAssets.filter((a: MarginAsset) => parseFloat(a.free) > 0).length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-2">
                      No assets available
                    </p>
                  )}
                </div>
                <div className="flex items-start gap-2 p-2 bg-green-50 border border-green-200 rounded-md">
                  <Info className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-green-700">
                    Binance will automatically use any available assets (especially USDT) to repay your {asset} debt
                  </p>
                </div>
              </div>
            )}

            {/* Action Button */}
            <Button
              onClick={handleRepay}
              disabled={!amount || parseFloat(amount) <= 0 || isLoading || totalOwed === 0}
              className="w-full"
              variant="default"
            >
              {repayMutation.isPending ? "Repaying..." : `Repay ${asset}`}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
