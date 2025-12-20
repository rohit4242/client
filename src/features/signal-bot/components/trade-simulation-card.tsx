"use client";

import { Activity, AlertTriangle, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface TradeSimulationCardProps {
    tradingCalculations: any;
    validationResult: any;
    isValidating: boolean;
    baseAsset: string;
    quoteAsset: string;
    watchedTradeAmount: number;
    watchedTradeAmountType: "QUOTE" | "BASE";
    watchedAccountType: string;
}

export function TradeSimulationCard({
    tradingCalculations,
    validationResult,
    isValidating,
    baseAsset,
    quoteAsset,
    watchedTradeAmount,
    watchedTradeAmountType,
    watchedAccountType,
}: TradeSimulationCardProps) {
    if (!tradingCalculations) return null;

    return (
        <div className="space-y-4">
            <Card className="rounded-xl border bg-card p-0 overflow-hidden shadow-sm">
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
                                        </span>
                                        <div className="font-mono font-medium text-green-600">
                                            ${tradingCalculations.userMaxBorrowable.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </div>
                                        <div className="text-[10px] text-muted-foreground">
                                            Limit: ${tradingCalculations.exchangeMaxBorrowable.toLocaleString(undefined, { maximumFractionDigits: 0 })}
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
                            Exchange constraints applied
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
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
                                {validationResult.errors.map((error: string, index: number) => (
                                    <div key={index} className="flex items-start gap-2 text-red-600 text-xs bg-red-50 dark:bg-red-950/50 p-2 rounded">
                                        <AlertTriangle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                                        <span>{error}</span>
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
        </div>
    );
}
