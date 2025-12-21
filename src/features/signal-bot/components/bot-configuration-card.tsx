"use client";

import {
    FormField,
    FormItem,
    FormLabel,
    FormControl,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Bot as BotIcon, Loader2, CheckCircle2 } from "lucide-react";
import {
    SIGNAL_BOT_SYMBOLS,
    ORDER_TYPE_OPTIONS,
    ACCOUNT_TYPE_OPTIONS,
} from "@/features/signal-bot";
import { useBotFormContext } from "../contexts/bot-form-context";

export function BotConfigurationCard() {
    const { form, exchanges, isLoadingExchanges, selectedExchange } =
        useBotFormContext();

    return (
        <Card className="border-slate-200/60 shadow-sm overflow-hidden">
            <CardHeader className="pb-3 pt-4 px-4 border-b bg-gradient-to-r from-slate-50 to-slate-100/50">
                <CardTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-800">
                    <div className="p-1.5 bg-teal-500/10 rounded-lg">
                        <BotIcon className="h-4 w-4 text-teal-600" />
                    </div>
                    Bot Configuration
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4 px-4 pb-4">
                <div className="grid grid-cols-1 gap-4">
                    {/* Bot Name and Description */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xs font-semibold text-slate-600 uppercase tracking-tight">
                                        Bot Name
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="My BTC Strategy"
                                            {...field}
                                            className="bg-white border-slate-200 focus:border-teal-500 focus:ring-teal-500/20 transition-all"
                                        />
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
                                    <FormLabel className="text-xs font-semibold text-slate-600 uppercase tracking-tight">
                                        Description <span className="text-slate-400">(Optional)</span>
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Trend following strategy..."
                                            {...field}
                                            value={field.value || ""}
                                            className="bg-white border-slate-200 focus:border-teal-500 focus:ring-teal-500/20 transition-all"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    {/* Exchange and Symbol */}
                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="exchangeId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xs font-semibold text-slate-600 uppercase tracking-tight flex items-center gap-2">
                                        Exchange
                                        {isLoadingExchanges && (
                                            <Loader2 className="h-3 w-3 animate-spin text-teal-500" />
                                        )}
                                        {!isLoadingExchanges && selectedExchange && (
                                            <CheckCircle2 className="h-3 w-3 text-green-500" />
                                        )}
                                    </FormLabel>
                                    {isLoadingExchanges ? (
                                        <div className="space-y-2">
                                            <Skeleton className="h-10 w-full rounded-md" />
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <Loader2 className="h-3 w-3 animate-spin" />
                                                <span>Loading exchanges...</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="bg-white border-slate-200 focus:border-teal-500 focus:ring-teal-500/20">
                                                    <SelectValue placeholder="Select exchange" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {exchanges.length === 0 ? (
                                                    <div className="py-6 text-center text-muted-foreground text-sm">
                                                        No active exchanges found
                                                    </div>
                                                ) : (
                                                    exchanges.map((exchange) => (
                                                        <SelectItem key={exchange.id} value={exchange.id}>
                                                            <div className="flex items-center gap-2">
                                                                <div className="h-2 w-2 rounded-full bg-green-500" />
                                                                {exchange.name}
                                                            </div>
                                                        </SelectItem>
                                                    ))
                                                )}
                                            </SelectContent>
                                        </Select>
                                    )}
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="symbols"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xs font-semibold text-slate-600 uppercase tracking-tight">
                                        Trading Pair
                                    </FormLabel>
                                    <Select
                                        onValueChange={(value) => field.onChange([value])}
                                        value={field.value?.[0] || ""}
                                    >
                                        <FormControl>
                                            <SelectTrigger className="bg-white border-slate-200 focus:border-teal-500 focus:ring-teal-500/20">
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

                    {/* Order Type and Account Type */}
                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="orderType"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xs font-semibold text-slate-600 uppercase tracking-tight">
                                        Order Type
                                    </FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="bg-white border-slate-200 focus:border-teal-500 focus:ring-teal-500/20">
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
                                    <FormLabel className="text-xs font-semibold text-slate-600 uppercase tracking-tight">
                                        Account Type
                                    </FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="bg-white border-slate-200 focus:border-teal-500 focus:ring-teal-500/20">
                                                <SelectValue placeholder="Select account" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {ACCOUNT_TYPE_OPTIONS.map((option) => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    <div className="flex items-center gap-2">
                                                        {option.value === "MARGIN" && (
                                                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
                                                                LEVERAGE
                                                            </span>
                                                        )}
                                                        {option.label}
                                                    </div>
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
    );
}
