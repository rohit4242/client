"use client";

import { Shield, Target, TrendingDown, TrendingUp, Info } from "lucide-react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import {
    FormField,
    FormItem,
    FormLabel,
    FormControl,
    FormDescription,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useBotFormContext } from "../contexts/bot-form-context";

export function RiskManagementCard() {
    const { form, calculations } = useBotFormContext();

    const stopLoss = form.watch("stopLoss");
    const takeProfit = form.watch("takeProfit");

    const rrRatio =
        stopLoss && takeProfit ? (takeProfit / stopLoss).toFixed(2) : null;

    return (
        <Card className="overflow-hidden border-slate-200/60 shadow-sm">
            <CardHeader className="pb-4 border-b bg-gradient-to-r from-blue-50/50 to-slate-50">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-xl">
                            <Shield className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <CardTitle className="text-base font-bold text-slate-800">
                                Risk Management
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Protect your capital with automatic stop loss and take profit
                            </CardDescription>
                        </div>
                    </div>
                    {rrRatio && (
                        <Badge
                            variant="outline"
                            className={`font-mono text-xs px-3 py-1 ${parseFloat(rrRatio) >= 2
                                ? "bg-green-50 border-green-200 text-green-700"
                                : parseFloat(rrRatio) >= 1
                                    ? "bg-amber-50 border-amber-200 text-amber-700"
                                    : "bg-red-50 border-red-200 text-red-700"
                                }`}
                        >
                            R:R = 1:{rrRatio}
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
                {/* Stop Loss and Take Profit */}
                <div className="grid grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="stopLoss"
                        render={({ field }) => {
                            const useStopLoss = form.watch("useStopLoss");
                            return (
                                <FormItem>
                                    <div className="flex items-center justify-between mb-2">
                                        <FormLabel className="flex items-center gap-2 text-sm font-semibold text-red-700">
                                            <div className="p-1 bg-red-100 rounded">
                                                <TrendingDown className="h-3.5 w-3.5 text-red-600" />
                                            </div>
                                            Stop Loss
                                        </FormLabel>
                                        <FormField
                                            control={form.control}
                                            name="useStopLoss"
                                            render={({ field: toggleField }) => (
                                                <FormControl>
                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={toggleField.value}
                                                            onChange={(e) => {
                                                                toggleField.onChange(e.target.checked);
                                                                if (!e.target.checked) {
                                                                    form.setValue("stopLoss", null);
                                                                }
                                                            }}
                                                            className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                                                        />
                                                        <span className="text-xs text-slate-600">Enable</span>
                                                    </label>
                                                </FormControl>
                                            )}
                                        />
                                    </div>
                                    <FormControl>
                                        <div className="relative">
                                            <Input
                                                type="number"
                                                step="0.1"
                                                min="0.1"
                                                max="50"
                                                disabled={!useStopLoss}
                                                className={`pr-8 font-mono text-lg ${useStopLoss
                                                        ? "bg-white border-red-200 focus:border-red-400 focus:ring-red-400/20"
                                                        : "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                                                    }`}
                                                {...field}
                                                onChange={(e) =>
                                                    field.onChange(
                                                        e.target.value ? Number(e.target.value) : null
                                                    )
                                                }
                                                value={field.value || ""}
                                                placeholder="2.0"
                                            />
                                            <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold ${useStopLoss ? "text-red-500" : "text-slate-400"
                                                }`}>
                                                %
                                            </span>
                                        </div>
                                    </FormControl>
                                    <FormDescription className="text-xs text-slate-500">
                                        Close position when loss exceeds this %
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            );
                        }}
                    />

                    <FormField
                        control={form.control}
                        name="takeProfit"
                        render={({ field }) => {
                            const useTakeProfit = form.watch("useTakeProfit");
                            return (
                                <FormItem>
                                    <div className="flex items-center justify-between mb-2">
                                        <FormLabel className="flex items-center gap-2 text-sm font-semibold text-green-700">
                                            <div className="p-1 bg-green-100 rounded">
                                                <TrendingUp className="h-3.5 w-3.5 text-green-600" />
                                            </div>
                                            Take Profit
                                        </FormLabel>
                                        <FormField
                                            control={form.control}
                                            name="useTakeProfit"
                                            render={({ field: toggleField }) => (
                                                <FormControl>
                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={toggleField.value}
                                                            onChange={(e) => {
                                                                toggleField.onChange(e.target.checked);
                                                                if (!e.target.checked) {
                                                                    form.setValue("takeProfit", null);
                                                                }
                                                            }}
                                                            className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                                                        />
                                                        <span className="text-xs text-slate-600">Enable</span>
                                                    </label>
                                                </FormControl>
                                            )}
                                        />
                                    </div>
                                    <FormControl>
                                        <div className="relative">
                                            <Input
                                                type="number"
                                                step="0.1"
                                                min="0.1"
                                                max="100"
                                                disabled={!useTakeProfit}
                                                className={`pr-8 font-mono text-lg ${useTakeProfit
                                                        ? "bg-white border-green-200 focus:border-green-400 focus:ring-green-400/20"
                                                        : "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                                                    }`}
                                                {...field}
                                                onChange={(e) =>
                                                    field.onChange(
                                                        e.target.value ? Number(e.target.value) : null
                                                    )
                                                }
                                                value={field.value || ""}
                                                placeholder="4.0"
                                            />
                                            <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold ${useTakeProfit ? "text-green-500" : "text-slate-400"
                                                }`}>
                                                %
                                            </span>
                                        </div>
                                    </FormControl>
                                    <FormDescription className="text-xs text-slate-500">
                                        Take profit when gain exceeds this %
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            );
                        }}
                    />
                </div>

                {/* Exit Price Calculations */}
                {calculations?.exitPrices &&
                    calculations.currentPrice > 0 &&
                    (stopLoss || takeProfit) && (
                        <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <Target className="h-4 w-4 text-slate-500" />
                                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                                    Calculated Exit Prices
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                {calculations.exitPrices.stopLossPrice && (
                                    <div className="bg-red-50/50 rounded-lg p-3 border border-red-100">
                                        <div className="text-[10px] text-red-600 uppercase font-semibold mb-0.5">
                                            Stop Loss at
                                        </div>
                                        <div className="font-mono font-bold text-lg text-red-700">
                                            $
                                            {calculations.exitPrices.stopLossPrice.toLocaleString(
                                                undefined,
                                                { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                                            )}
                                        </div>
                                    </div>
                                )}
                                {calculations.exitPrices.takeProfitPrice && (
                                    <div className="bg-green-50/50 rounded-lg p-3 border border-green-100">
                                        <div className="text-[10px] text-green-600 uppercase font-semibold mb-0.5">
                                            Take Profit at
                                        </div>
                                        <div className="font-mono font-bold text-lg text-green-700">
                                            $
                                            {calculations.exitPrices.takeProfitPrice.toLocaleString(
                                                undefined,
                                                { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                {/* Tips Panel */}
                <div className="bg-gradient-to-r from-blue-50 to-blue-100/30 border border-blue-100 p-4 rounded-xl">
                    <div className="flex items-start space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Info className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                            <p className="font-semibold text-sm text-blue-900">
                                Risk Management Tips
                            </p>
                            <ul className="text-blue-700 mt-2 space-y-2 text-xs">
                                <li className="flex items-center gap-2">
                                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                                    Use a 1:2 risk-reward ratio (e.g., 2% SL, 4% TP)
                                </li>
                                <li className="flex items-center gap-2">
                                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                                    Never risk more than 2-5% of your portfolio per trade
                                </li>
                                <li className="flex items-center gap-2">
                                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                                    Always set stop loss to protect your capital
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
