"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Send, TrendingUp, TrendingDown, Target, BarChart3, Zap, Bot } from "lucide-react";
import { BotWithExchange } from "@/features/signal-bot";
import { CreateSignalInputSchema } from "../../schemas/signal.schema";
import { useCreateSignalMutation } from "../../hooks/use-signal-mutations";

type CreateSignalData = {
    botId: string;
    action: "ENTER_LONG" | "EXIT_LONG" | "ENTER_SHORT" | "EXIT_SHORT";
    symbol: string;
    price?: number;
    message?: string;
    visibleToCustomer?: boolean;
};

interface CreateSignalDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    userId: string;
    bots: BotWithExchange[];
    onSuccess?: () => void;
}

export function CreateSignalDialog({ open, onOpenChange, bots, onSuccess }: CreateSignalDialogProps) {
    const createMutation = useCreateSignalMutation();

    const form = useForm<CreateSignalData>({
        resolver: zodResolver(CreateSignalInputSchema),
        defaultValues: {
            action: "ENTER_LONG",
            price: undefined,
            symbol: "",
            botId: "",
            visibleToCustomer: true,
        } as any,
    });

    const selectedBotId = form.watch("botId");
    const selectedBot = bots.find(b => b.id === selectedBotId);

    const handleBotChange = (botId: string) => {
        form.setValue("botId", botId);
        const bot = bots.find(b => b.id === botId);
        if (bot && bot.symbols.length > 0) {
            form.setValue("symbol", bot.symbols[0]);
        } else {
            form.setValue("symbol", "");
        }
    };

    const onSubmit = async (data: any) => {
        try {
            await createMutation.mutateAsync({
                ...data,
                visibleToCustomer: !!data.visibleToCustomer
            });
            onOpenChange(false);
            if (onSuccess) onSuccess();
            form.reset();
        } catch (error) {
            console.error("Error creating signal:", error);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md p-0 overflow-hidden border-none shadow-2xl bg-slate-50">
                <div className="p-6 bg-white border-b border-slate-100">
                    <DialogHeader>
                        <div className="flex items-center gap-3 mb-1">
                            <div className="p-2 bg-teal-50 rounded-xl">
                                <Send className="h-5 w-5 text-teal-600" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-bold">Create Signal</DialogTitle>
                                <DialogDescription>
                                    Manually trigger a trade signal for a specific bot.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                </div>

                <div className="p-6">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                            <FormField
                                control={form.control}
                                name="botId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Select Bot</FormLabel>
                                        <Select onValueChange={handleBotChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-white shadow-sm focus:ring-teal-500">
                                                    <SelectValue placeholder="Select a bot" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="rounded-2xl shadow-xl">
                                                {bots.map((bot) => (
                                                    <SelectItem key={bot.id} value={bot.id} className="rounded-xl py-3">
                                                        <div className="flex items-center gap-2 font-bold text-slate-700">
                                                            <Bot className="size-4 text-slate-400" />
                                                            {bot.name}
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {selectedBot && (
                                <div className="grid grid-cols-1 gap-5 animate-in fade-in slide-in-from-top-2">
                                    <FormField
                                        control={form.control}
                                        name="action"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Signal Action</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-white shadow-sm focus:ring-teal-500">
                                                            <SelectValue placeholder="Select action" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent className="rounded-2xl shadow-xl">
                                                        <SelectItem value="ENTER_LONG" className="rounded-xl py-3">
                                                            <div className="flex items-center text-emerald-600 font-bold">
                                                                <TrendingUp className="mr-2 h-4 w-4" />
                                                                ENTER LONG (Buy)
                                                            </div>
                                                        </SelectItem>
                                                        <SelectItem value="EXIT_LONG" className="rounded-xl py-3">
                                                            <div className="flex items-center text-emerald-500 font-bold">
                                                                <TrendingDown className="mr-2 h-4 w-4" />
                                                                EXIT LONG (Sell)
                                                            </div>
                                                        </SelectItem>
                                                        {selectedBot.accountType === "MARGIN" && (
                                                            <>
                                                                <SelectItem value="ENTER_SHORT" className="rounded-xl py-3">
                                                                    <div className="flex items-center text-rose-600 font-bold">
                                                                        <TrendingDown className="mr-2 h-4 w-4" />
                                                                        ENTER SHORT (Sell)
                                                                    </div>
                                                                </SelectItem>
                                                                <SelectItem value="EXIT_SHORT" className="rounded-xl py-3">
                                                                    <div className="flex items-center text-rose-500 font-bold">
                                                                        <TrendingUp className="mr-2 h-4 w-4" />
                                                                        EXIT SHORT (Buy)
                                                                    </div>
                                                                </SelectItem>
                                                            </>
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="symbol"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Asset Symbol</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-white shadow-sm focus:ring-teal-500 font-bold uppercase">
                                                                <SelectValue placeholder="Select symbol" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent className="rounded-2xl shadow-xl">
                                                            {selectedBot.symbols.map((symbol) => (
                                                                <SelectItem key={symbol} value={symbol} className="rounded-xl cursor-pointer py-2">
                                                                    <div className="flex items-center gap-2">
                                                                        <Target className="size-3 text-slate-400" />
                                                                        <span className="font-bold">{symbol}</span>
                                                                    </div>
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
                                            name="price"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 text-nowrap">Price (Optional)</FormLabel>
                                                    <FormControl>
                                                        <div className="relative">
                                                            <BarChart3 className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                                                            <Input
                                                                type="number"
                                                                step="any"
                                                                className="pl-11 h-12 rounded-2xl border-slate-200 bg-white shadow-sm focus:ring-teal-500 font-bold"
                                                                placeholder="Market"
                                                                {...field}
                                                                onChange={(e) => {
                                                                    const val = e.target.value;
                                                                    field.onChange(val === "" ? undefined : Number(val));
                                                                }}
                                                                value={field.value ?? ""}
                                                                disabled={createMutation.isPending}
                                                            />
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center justify-between pt-4 gap-3 bg-white -mx-6 -mb-6 p-6 border-t border-slate-100">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => onOpenChange(false)}
                                    className="h-12 px-6 rounded-xl font-bold text-slate-400 hover:text-slate-900"
                                    disabled={createMutation.isPending}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={createMutation.isPending || !selectedBot}
                                    className="h-12 px-8 rounded-xl font-black uppercase tracking-widest text-[10px] bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-200"
                                >
                                    {createMutation.isPending ? (
                                        <div className="flex items-center gap-2">
                                            <Loader2 className="size-3 animate-spin" />
                                            Creating...
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <Zap className="size-3 fill-current" />
                                            Create Signal
                                        </div>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </div>
            </DialogContent>
        </Dialog>
    );
}
