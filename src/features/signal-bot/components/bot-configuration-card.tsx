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
import { Bot as BotIcon } from "lucide-react";
import {
    SIGNAL_BOT_SYMBOLS,
    ORDER_TYPE_OPTIONS,
    ACCOUNT_TYPE_OPTIONS,
} from "@/features/signal-bot";
import { Exchange } from "@/types/exchange";
import { UseFormReturn } from "react-hook-form";
import { CreateBotInput } from "@/features/signal-bot";

interface BotConfigurationCardProps {
    form: UseFormReturn<CreateBotInput>;
    activeExchanges: Exchange[];
}

export function BotConfigurationCard({ form, activeExchanges }: BotConfigurationCardProps) {
    return (
        <Card className="border-slate-200/60 shadow-sm">
            <CardHeader className="pb-3 pt-4 px-4 border-b bg-slate-50/50">
                <CardTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-800">
                    <BotIcon className="h-4 w-4 text-teal-600" />
                    Bot Configuration
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4 px-4 pb-4">
                <div className="grid grid-cols-1 gap-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                                        <Input placeholder="Trend following strategy..." {...field} value={field.value || ""} className="bg-background" />
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
    );
}
