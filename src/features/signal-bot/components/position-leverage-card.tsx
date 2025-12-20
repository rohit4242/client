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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    TRADE_AMOUNT_TYPE_OPTIONS,
    SIDE_EFFECT_TYPE_OPTIONS,
} from "@/features/signal-bot";
import { UseFormReturn } from "react-hook-form";
import { CreateBotInput } from "@/features/signal-bot";

interface PositionLeverageCardProps {
    form: UseFormReturn<CreateBotInput>;
    baseAsset: string;
    quoteAsset: string;
    currentPrice: number | null;
    tradingCalculations: any;
}

export function PositionLeverageCard({
    form,
    baseAsset,
    quoteAsset,
    currentPrice,
    tradingCalculations,
}: PositionLeverageCardProps) {
    const watchedAccountType = form.watch("accountType");
    const watchedTradeAmountType = form.watch("tradeAmountType");
    const watchedMaxBorrowPercent = form.watch("maxBorrowPercent");

    return (
        <Card className="border-teal-100 shadow-md">
            <CardHeader className="pb-3 pt-4 px-4 border-b bg-teal-50/30">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-800">
                            <Wallet className="h-4 w-4 text-teal-600" />
                            Position & Leverage
                        </CardTitle>
                    </div>
                    {currentPrice && (
                        <Badge variant="outline" className="text-xs font-mono bg-background">
                            1 {baseAsset} ≈ ${currentPrice.toFixed(2)}
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4 px-4 pb-4">
                {/* Trade Amount Input */}
                <FormField
                    control={form.control}
                    name="tradeAmount"
                    render={({ field: { value, ...fieldProps } }) => (
                        <FormItem className="space-y-3">
                            <div className="flex justify-between items-center">
                                <FormLabel className="text-xs font-bold text-slate-600 uppercase tracking-tight">Trade Amount</FormLabel>
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
                                        className="h-10 text-base font-mono pl-4 pr-32 bg-white"
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
                                <FormLabel className="text-xs font-bold text-slate-600 uppercase tracking-tight">Leverage</FormLabel>
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
                                                    value={field.value || ""}
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
            </CardContent>
        </Card>
    );
}
