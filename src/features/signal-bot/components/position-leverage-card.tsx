"use client";

import {
    FormField,
    FormItem,
    FormLabel,
    FormControl,
    FormDescription,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Wallet,
    Loader2,
    TrendingUp,
    AlertCircle,
    DollarSign,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    TRADE_AMOUNT_TYPE_OPTIONS,
    SIDE_EFFECT_TYPE_OPTIONS,
} from "@/features/signal-bot";
import { useBotFormContext } from "../contexts/bot-form-context";

export function PositionLeverageCard() {
    const {
        form,
        baseAsset,
        quoteAsset,
        currentPrice,
        isLoadingPrice,
        isLoadingBorrowData,
        calculations,
        watchedAccountType,
        watchedTradeAmountType,
    } = useBotFormContext();

    const watchedMaxBorrowPercent = form.watch("maxBorrowPercent");

    return (
        <Card className="border-slate-200/60 shadow-sm overflow-hidden">
            <CardHeader className="pb-3 pt-4 px-4 border-b bg-gradient-to-r from-teal-50/50 to-slate-50">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-800">
                        <div className="p-1.5 bg-teal-500/10 rounded-lg">
                            <Wallet className="h-4 w-4 text-teal-600" />
                        </div>
                        Position & Leverage
                    </CardTitle>

                    {/* Live Price Badge */}
                    <div className="flex items-center gap-2">
                        {isLoadingPrice ? (
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200">
                                <Loader2 className="h-3 w-3 animate-spin text-slate-500" />
                                <span className="text-xs text-slate-500 font-medium">
                                    Fetching price...
                                </span>
                            </div>
                        ) : currentPrice ? (
                            <Badge
                                variant="outline"
                                className="text-xs font-mono bg-white border-green-200 text-green-700 px-3 py-1"
                            >
                                <TrendingUp className="h-3 w-3 mr-1.5" />1 {baseAsset} ≈ $
                                {currentPrice.toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                })}
                            </Badge>
                        ) : (
                            <Badge
                                variant="outline"
                                className="text-xs font-mono bg-amber-50 border-amber-200 text-amber-700"
                            >
                                <AlertCircle className="h-3 w-3 mr-1.5" />
                                No price data
                            </Badge>
                        )}
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-5 pt-5 px-4 pb-5">
                {/* Trade Amount Input */}
                <FormField
                    control={form.control}
                    name="tradeAmount"
                    render={({ field: { value, ...fieldProps } }) => (
                        <FormItem className="space-y-3">
                            <div className="flex justify-between items-center">
                                <FormLabel className="text-xs font-bold text-slate-600 uppercase tracking-tight flex items-center gap-2">
                                    <DollarSign className="h-3.5 w-3.5 text-teal-600" />
                                    Trade Amount
                                </FormLabel>
                                <div className="text-right text-xs text-muted-foreground">
                                    {calculations?.hasPrice ? (
                                        <span className="font-mono bg-slate-100 px-2 py-1 rounded">
                                            ≈{" "}
                                            {watchedTradeAmountType === "QUOTE"
                                                ? `${calculations.baseValue.toFixed(6)} ${baseAsset}`
                                                : `$${calculations.usdtValue.toFixed(2)}`}
                                        </span>
                                    ) : isLoadingPrice ? (
                                        <Skeleton className="h-5 w-24" />
                                    ) : null}
                                </div>
                            </div>
                            <div className="flex space-x-2">
                                <div className="relative flex-1">
                                    <Input
                                        type="number"
                                        placeholder="0.00"
                                        className="h-12 text-lg font-mono pl-4 pr-32 bg-white border-slate-200 focus:border-teal-500 focus:ring-teal-500/20 transition-all"
                                        step={watchedTradeAmountType === "QUOTE" ? "1" : "0.00001"}
                                        {...fieldProps}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            fieldProps.onChange(val === "" ? "" : Number(val));
                                        }}
                                        value={value ?? ""}
                                    />
                                    <div className="absolute top-1 right-1 bottom-1 bg-slate-100/80 rounded-md p-1 flex border border-slate-200/50">
                                        {TRADE_AMOUNT_TYPE_OPTIONS.map((option) => (
                                            <button
                                                key={option.value}
                                                type="button"
                                                onClick={() =>
                                                    form.setValue(
                                                        "tradeAmountType",
                                                        option.value as "QUOTE" | "BASE"
                                                    )
                                                }
                                                className={`px-3 text-xs font-semibold rounded-sm transition-all ${watchedTradeAmountType === option.value
                                                    ? "bg-white text-teal-700 shadow-sm border border-teal-200"
                                                    : "text-slate-500 hover:text-slate-700"
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

                <Separator className="bg-slate-100" />

                {/* Leverage Slider */}
                <FormField
                    control={form.control}
                    name="leverage"
                    render={({ field }) => (
                        <FormItem className="space-y-4">
                            <div className="flex justify-between items-center">
                                <FormLabel className="text-xs font-bold text-slate-600 uppercase tracking-tight">
                                    Leverage
                                </FormLabel>
                                <Badge
                                    variant={field.value > 1 ? "default" : "secondary"}
                                    className={`font-mono text-sm px-3 ${field.value > 3
                                        ? "bg-amber-500"
                                        : field.value > 1
                                            ? "bg-teal-600"
                                            : ""
                                        }`}
                                >
                                    {field.value}x
                                </Badge>
                            </div>
                            <FormControl>
                                <div className="flex items-center gap-4">
                                    <span className="text-xs text-muted-foreground w-6 font-mono">
                                        1x
                                    </span>
                                    <div className="flex-1 relative">
                                        <Slider
                                            min={1}
                                            max={watchedAccountType === "MARGIN" ? 4 : 1}
                                            step={1}
                                            value={[field.value || 1]}
                                            onValueChange={(vals) => field.onChange(vals[0])}
                                            disabled={watchedAccountType === "SPOT"}
                                            className="flex-1"
                                        />
                                        {field.value > 2 && watchedAccountType === "MARGIN" && (
                                            <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-amber-600 font-medium">
                                                ⚠️ High leverage
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-xs text-muted-foreground w-8 text-right font-mono">
                                        {watchedAccountType === "MARGIN" ? "4x" : "1x"}
                                    </span>
                                </div>
                            </FormControl>
                            <FormDescription className="text-xs">
                                {watchedAccountType === "SPOT" ? (
                                    <span className="text-slate-400">
                                        Spot trading does not use leverage
                                    </span>
                                ) : (
                                    <span className="text-teal-700 font-medium">
                                        Margin trading enabled - adjust leverage carefully
                                    </span>
                                )}
                            </FormDescription>
                        </FormItem>
                    )}
                />

                {/* Max Borrow Settings (Margin Only) */}
                {watchedAccountType === "MARGIN" && (
                    <div className="rounded-xl border border-teal-100 bg-gradient-to-br from-teal-50/30 to-white p-4 space-y-4">
                        <div className="flex items-center justify-between">
                            <FormLabel className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-tight">
                                Max Borrow Limit
                                {isLoadingBorrowData ? (
                                    <Loader2 className="h-3 w-3 animate-spin text-teal-500" />
                                ) : (
                                    <Badge
                                        variant="outline"
                                        className="text-[9px] h-4 px-1.5 bg-teal-50 border-teal-200 text-teal-700"
                                    >
                                        RISK CONTROL
                                    </Badge>
                                )}
                            </FormLabel>
                            <div className="flex gap-1">
                                {[25, 50, 75, 100].map((pct) => (
                                    <Button
                                        key={pct}
                                        type="button"
                                        variant={
                                            watchedMaxBorrowPercent === pct ? "default" : "outline"
                                        }
                                        size="sm"
                                        className={`h-6 text-[10px] px-2 ${watchedMaxBorrowPercent === pct
                                            ? "bg-teal-600 hover:bg-teal-700"
                                            : ""
                                            }`}
                                        onClick={() => form.setValue("maxBorrowPercent", pct)}
                                    >
                                        {pct}%
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {isLoadingBorrowData ? (
                            <div className="space-y-2">
                                <Skeleton className="h-2 w-full" />
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                    <span>Fetching borrowing limits from {quoteAsset}...</span>
                                </div>
                            </div>
                        ) : (
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
                                                        className="h-7 pr-6 text-right font-mono text-xs bg-white"
                                                        onChange={(e) =>
                                                            field.onChange(Number(e.target.value))
                                                        }
                                                        value={field.value || ""}
                                                    />
                                                    <span className="absolute right-2 text-xs text-muted-foreground">
                                                        %
                                                    </span>
                                                </div>
                                            </div>
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        )}

                        <FormField
                            control={form.control}
                            name="sideEffectType"
                            render={({ field }) => (
                                <FormItem>
                                    <div className="flex items-center justify-between mb-2">
                                        <FormLabel className="text-xs font-medium text-slate-600">
                                            Side Effect
                                        </FormLabel>
                                    </div>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="h-8 text-xs bg-white border-slate-200">
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
            </CardContent>
        </Card>
    );
}
