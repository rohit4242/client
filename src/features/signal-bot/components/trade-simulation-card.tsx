"use client";

import {
    Activity,
    AlertTriangle,
    Loader2,
    CheckCircle2,
    XCircle,
    TrendingUp,
    Wallet,
    Coins,
    RefreshCw,
    AlertCircle,
    RotateCcw,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { useBotFormContext } from "../contexts/bot-form-context";

export function TradeSimulationCard() {
    const {
        calculations,
        validationResult,
        isValidating,
        isRecalculating,
        isLoadingBorrowData,
        borrowError,
        refetchBorrowData,
        baseAsset,
        quoteAsset,
        watchedTradeAmount,
        watchedTradeAmountType,
        watchedAccountType,
    } = useBotFormContext();

    // Show loading skeleton when no calculations yet
    if (!calculations) {
        return (
            <Card className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 overflow-hidden">
                <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-3">
                    <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-slate-500">
                            Calculating trade simulation...
                        </p>
                        <p className="text-xs text-slate-400">
                            Select an exchange and enter an amount to see results
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const usagePercent =
        calculations.totalBuyingPower > 0
            ? Math.min(
                100,
                (calculations.leveragedValue / calculations.totalBuyingPower) * 100
            )
            : 0;

    return (
        <div className="space-y-4">
            {/* Borrow Error Banner */}
            {borrowError && watchedAccountType === "MARGIN" && (
                <Card className="border-2 border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 overflow-hidden">
                    <CardContent className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-100 rounded-lg">
                                <AlertCircle className="h-5 w-5 text-amber-600" />
                            </div>
                            <div>
                                <p className="font-semibold text-amber-900 text-sm">
                                    Failed to Fetch Borrowing Limits
                                </p>
                                <p className="text-xs text-amber-700 mt-0.5">
                                    {borrowError.includes("recvWindow")
                                        ? "System time is out of sync with exchange"
                                        : borrowError}
                                </p>
                            </div>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => refetchBorrowData()}
                            disabled={isLoadingBorrowData}
                            className="border-amber-300 bg-white hover:bg-amber-100 text-amber-700"
                        >
                            {isLoadingBorrowData ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                                <RotateCcw className="h-4 w-4 mr-2" />
                            )}
                            Retry
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Main Simulation Card */}
            <Card className="rounded-xl border overflow-hidden shadow-sm relative">
                {/* Loading Overlay */}
                {isRecalculating && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center rounded-xl">
                        <div className="p-4 bg-white rounded-2xl shadow-lg border border-slate-200 flex flex-col items-center gap-3">
                            <div className="relative">
                                <RefreshCw className="h-8 w-8 text-teal-600 animate-spin" />
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-semibold text-slate-700">
                                    Recalculating...
                                </p>
                                <p className="text-xs text-slate-500">
                                    Updating trade simulation
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="bg-gradient-to-r from-slate-100 to-slate-50 px-4 py-3 flex items-center justify-between border-b">
                    <h4 className="font-semibold text-sm flex items-center gap-2 text-slate-800">
                        <div className="p-1.5 bg-blue-500/10 rounded-lg">
                            <Activity className="h-4 w-4 text-blue-600" />
                        </div>
                        Trade Simulation
                    </h4>
                    <div className="flex items-center gap-2">
                        {/* Refresh Button */}
                        {watchedAccountType === "MARGIN" && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => refetchBorrowData()}
                                disabled={isLoadingBorrowData}
                                className="h-7 px-2 text-slate-500 hover:text-slate-700"
                            >
                                <RefreshCw
                                    className={`h-3.5 w-3.5 ${isLoadingBorrowData ? "animate-spin" : ""
                                        }`}
                                />
                            </Button>
                        )}
                        {calculations.hasSufficientWithBorrow ? (
                            <Badge className="bg-green-500/10 text-green-700 border-green-200 flex items-center gap-1.5">
                                <CheckCircle2 className="h-3 w-3" />
                                Ready to Trade
                            </Badge>
                        ) : (
                            <Badge
                                variant="destructive"
                                className="bg-red-500/10 text-red-700 border-red-200 flex items-center gap-1.5"
                            >
                                <XCircle className="h-3 w-3" />
                                Insufficient Funds
                            </Badge>
                        )}
                    </div>
                </div>

                <div className="p-4 space-y-5">
                    {/* Buying Power Usage Progress */}
                    <div className="space-y-3">
                        <div className="flex justify-between text-xs">
                            <span className="text-slate-500 font-medium">
                                Buying Power Usage
                            </span>
                            <span
                                className={`font-mono font-bold ${usagePercent > 80
                                    ? "text-red-600"
                                    : usagePercent > 50
                                        ? "text-amber-600"
                                        : "text-green-600"
                                    }`}
                            >
                                {usagePercent.toFixed(1)}%
                            </span>
                        </div>
                        <Progress value={usagePercent} className="h-3 bg-slate-100" />
                        {usagePercent > 80 && (
                            <div className="flex justify-end mt-1">
                                <span className="text-[10px] text-red-600 font-medium bg-red-50 px-1.5 py-0.5 rounded">
                                    ⚠️ High usage
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="rounded-lg bg-gradient-to-br from-slate-50 to-slate-100/50 p-3 border border-slate-200/50">
                            <div className="flex items-center gap-2 mb-1">
                                <Coins className="h-3.5 w-3.5 text-slate-400" />
                                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                                    Required Margin
                                </span>
                            </div>
                            <div className="font-mono font-bold text-lg text-slate-800">
                                $
                                {calculations.usdtValue.toLocaleString("en-US", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                })}
                            </div>
                        </div>

                        <div className="rounded-lg bg-gradient-to-br from-teal-50 to-slate-50 p-3 border border-teal-200/50">
                            <div className="flex items-center gap-2 mb-1">
                                <Wallet className="h-3.5 w-3.5 text-teal-500" />
                                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                                    Total Buying Power
                                </span>
                            </div>
                            <div className="font-mono font-bold text-lg text-teal-700">
                                $
                                {calculations.totalBuyingPower.toLocaleString("en-US", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                })}
                            </div>
                        </div>

                        {watchedAccountType === "MARGIN" && (
                            <>
                                <div className="rounded-lg bg-gradient-to-br from-green-50 to-slate-50 p-3 border border-green-200/50">
                                    <div className="flex items-center gap-2 mb-1">
                                        <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                                        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                                            Max Borrowable
                                        </span>
                                        {borrowError && (
                                            <AlertCircle className="h-3 w-3 text-amber-500" />
                                        )}
                                    </div>
                                    <div
                                        className={`font-mono font-bold text-lg ${borrowError ? "text-amber-600" : "text-green-700"
                                            }`}
                                    >
                                        $
                                        {calculations.userMaxBorrowable.toLocaleString("en-US", {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        })}
                                    </div>
                                    <div className="text-[10px] text-slate-400 mt-0.5">
                                        {borrowError ? (
                                            <span className="text-amber-500">Error fetching</span>
                                        ) : (
                                            <>
                                                Exchange limit: $
                                                {calculations.exchangeMaxBorrowable.toLocaleString(
                                                    undefined,
                                                    { maximumFractionDigits: 0 }
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="rounded-lg bg-gradient-to-br from-amber-50 to-slate-50 p-3 border border-amber-200/50">
                                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                                        To Borrow
                                    </span>
                                    <div className="font-mono font-bold text-lg text-amber-700">
                                        $
                                        {calculations.borrowAmount.toLocaleString("en-US", {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        })}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Alert Box for Issues */}
                    {(!calculations.hasSufficientWithBorrow ||
                        calculations.exceedsMaxBorrow) && (
                            <div className="bg-gradient-to-r from-red-50 to-red-100/50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                                <div className="p-2 bg-red-100 rounded-lg">
                                    <AlertTriangle className="h-5 w-5 text-red-600" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-semibold text-red-900">
                                        Trade Validation Failed
                                    </p>
                                    <p className="text-xs text-red-700">
                                        {borrowError
                                            ? "Unable to verify borrowing limits. Click Retry above to try again."
                                            : calculations.exceedsMaxBorrow
                                                ? "Borrowed amount exceeds your configured limit. Lower leverage or trade size."
                                                : "Insufficient balance to cover the required margin."}
                                    </p>
                                </div>
                            </div>
                        )}
                </div>
            </Card>

            {/* Validation Result Card */}
            {isValidating ? (
                <Card className="border-2 border-dashed border-blue-200 bg-blue-50/50 overflow-hidden">
                    <CardContent className="flex items-center gap-4 p-5">
                        <div className="p-3 bg-blue-100 rounded-full">
                            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                        </div>
                        <div>
                            <p className="font-medium text-blue-900">
                                Validating trade amount...
                            </p>
                            <p className="text-sm text-blue-700">
                                Checking exchange constraints for {baseAsset}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            ) : validationResult ? (
                <Card
                    className={`border-2 overflow-hidden ${validationResult.valid
                        ? "border-green-200 bg-gradient-to-br from-green-50/50 to-white"
                        : "border-red-200 bg-gradient-to-br from-red-50/50 to-white"
                        }`}
                >
                    <CardHeader className="pb-3 border-b border-slate-100">
                        <CardTitle className="flex items-center gap-2 text-base">
                            {validationResult.valid ? (
                                <>
                                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                                    <span className="text-green-800">Validated Trade Amount</span>
                                </>
                            ) : (
                                <>
                                    <XCircle className="h-5 w-5 text-red-600" />
                                    <span className="text-red-800">Invalid Trade Amount</span>
                                </>
                            )}
                        </CardTitle>
                        <CardDescription className="text-xs">
                            Exchange constraints have been applied
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                        {/* Trade Summary */}
                        <div className="rounded-xl border bg-white p-4 space-y-3">
                            <div className="flex justify-between text-sm border-b border-dashed border-slate-200 pb-2">
                                <span className="text-slate-500">You Entered:</span>
                                <span className="font-mono font-medium text-slate-700">
                                    {watchedTradeAmount}{" "}
                                    {watchedTradeAmountType === "QUOTE" ? quoteAsset : baseAsset}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-semibold text-slate-700">
                                    Bot Will Trade:
                                </span>
                                <span className="font-mono font-bold text-lg text-green-600">
                                    {validationResult.formattedQuantity?.toFixed(8)} {baseAsset}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm pt-2 border-t border-dashed border-slate-200">
                                <span className="text-slate-500">Notional Value:</span>
                                <span className="font-mono font-medium text-slate-700">
                                    ${validationResult.notionalValue?.toFixed(2)}
                                </span>
                            </div>
                        </div>

                        {/* Constraints Info */}
                        {validationResult.constraints && (
                            <div className="grid grid-cols-4 gap-2">
                                <div className="rounded-lg bg-slate-50 p-2 text-center border border-slate-200">
                                    <p className="text-[10px] text-slate-500 uppercase mb-0.5">
                                        Min Qty
                                    </p>
                                    <p className="font-mono text-xs font-medium">
                                        {validationResult.constraints.minQty}
                                    </p>
                                </div>
                                <div className="rounded-lg bg-slate-50 p-2 text-center border border-slate-200">
                                    <p className="text-[10px] text-slate-500 uppercase mb-0.5">
                                        Step Size
                                    </p>
                                    <p className="font-mono text-xs font-medium">
                                        {validationResult.constraints.stepSize}
                                    </p>
                                </div>
                                <div className="rounded-lg bg-slate-50 p-2 text-center border border-slate-200">
                                    <p className="text-[10px] text-slate-500 uppercase mb-0.5">
                                        Min Notional
                                    </p>
                                    <p className="font-mono text-xs font-medium">
                                        ${validationResult.constraints.minNotional}
                                    </p>
                                </div>
                                <div className="rounded-lg bg-slate-50 p-2 text-center border border-slate-200">
                                    <p className="text-[10px] text-slate-500 uppercase mb-0.5">
                                        Price
                                    </p>
                                    <p className="font-mono text-xs font-medium">
                                        ${validationResult.currentPrice?.toFixed(2)}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Errors */}
                        {validationResult.errors && validationResult.errors.length > 0 && (
                            <div className="space-y-2">
                                {validationResult.errors.map((error: string, index: number) => (
                                    <div
                                        key={index}
                                        className="flex items-start gap-3 text-red-700 text-sm bg-red-50 p-3 rounded-lg border border-red-200"
                                    >
                                        <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                        <span>{error}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            ) : null}
        </div>
    );
}
