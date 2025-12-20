"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormDescription,
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
import { Loader2, Send, TrendingUp, TrendingDown, Target, BarChart3, Zap } from "lucide-react";
import { BotWithExchange } from "@/features/signal-bot";

const manualSignalSchema = z.object({
    action: z.enum(["ENTER_LONG", "EXIT_LONG", "ENTER_SHORT", "EXIT_SHORT"]),
    symbol: z.string().min(1, "Symbol is required"),
    price: z.number().optional().nullable(),
});

type ManualSignalData = z.infer<typeof manualSignalSchema>;

interface ManualSignalDialogProps {
    bot: BotWithExchange;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ManualSignalDialog({ bot, open, onOpenChange }: ManualSignalDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<ManualSignalData>({
        resolver: zodResolver(manualSignalSchema),
        defaultValues: {
            action: "ENTER_LONG",
            symbol: bot.symbols[0] || "",
            price: null,
        },
    });

    const sendSignalMutation = useMutation({
        mutationFn: async (data: ManualSignalData) => {
            const webhookUrl = `/api/webhook/signal-bot/${bot.id}`;
            const payload = {
                secret: bot.webhookSecret,
                action: data.action,
                symbol: data.symbol,
                price: data.price || undefined, // Send undefined if 0 or null to let backend fetch price
                message: "Manual signal triggered from UI",
            };

            const response = await axios.post(webhookUrl, payload);
            return response.data;
        },
        onSuccess: (data) => {
            toast.success("Signal dispatched successfully!");
            if (data.execution) {
                if (data.execution.success) {
                    toast.success(`Trade executed: ${data.execution.tradeId || "Success"}`);
                } else {
                    toast.error(`Execution failed: ${data.execution.error}`);
                }
            }
            onOpenChange(false);
            form.reset();
        },
        onError: (error: AxiosError<{ error: string; message?: string }>) => {
            const errorMessage = error.response?.data?.error || error.response?.data?.message || "Failed to send signal";
            toast.error(errorMessage);
        },
        onSettled: () => {
            setIsSubmitting(false);
        },
    });

    const onSubmit = (data: ManualSignalData) => {
        setIsSubmitting(true);
        sendSignalMutation.mutate(data);
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
                                <DialogTitle className="text-xl font-bold">Manual Signal Trigger</DialogTitle>
                                <DialogDescription>
                                    Manually trigger a trade signal for <span className="font-semibold text-slate-900">{bot.name}</span>
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                </div>

                <div className="p-6">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                            <div className="grid grid-cols-1 gap-5">
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
                                                    {bot.accountType === "MARGIN" && (
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
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-white shadow-sm focus:ring-teal-500 font-bold uppercase">
                                                            <SelectValue placeholder="Select symbol" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent className="rounded-2xl shadow-xl">
                                                        {bot.symbols.map((symbol) => (
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
                                                            className="pl-11 h-12 rounded-2xl border-slate-200 bg-white shadow-sm focus:ring-teal-500 font-bold"
                                                            placeholder="Market"
                                                            {...field}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                field.onChange(val === "" ? null : Number(val));
                                                            }}
                                                            value={field.value ?? ""}
                                                            disabled={isSubmitting}
                                                        />
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-4 gap-3 bg-white -mx-6 -mb-6 p-6 border-t border-slate-100">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => onOpenChange(false)}
                                    className="h-12 px-6 rounded-xl font-bold text-slate-400 hover:text-slate-900"
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="h-12 px-8 rounded-xl font-black uppercase tracking-widest text-[10px] bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-200"
                                >
                                    {isSubmitting ? (
                                        <div className="flex items-center gap-2">
                                            <Loader2 className="size-3 animate-spin" />
                                            Dispatching...
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <Zap className="size-3 fill-current" />
                                            Dispatch Signal
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
