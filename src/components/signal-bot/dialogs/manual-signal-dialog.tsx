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
import { Loader2, Send, TrendingUp, TrendingDown } from "lucide-react";
import { SignalBot } from "@/types/signal-bot";

const manualSignalSchema = z.object({
    action: z.enum(["ENTER_LONG", "EXIT_LONG", "ENTER_SHORT", "EXIT_SHORT"]),
    symbol: z.string().min(1, "Symbol is required"),
    price: z.number().optional(),
});

type ManualSignalData = z.infer<typeof manualSignalSchema>;

interface ManualSignalDialogProps {
    bot: SignalBot;
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
        },
    });

    const sendSignalMutation = useMutation({
        mutationFn: async (data: ManualSignalData) => {
            const webhookUrl = `/api/webhook/signal-bot/${bot.id}`;
            const payload = {
                action: data.action,
                symbol: data.symbol,
                price: data.price || undefined, // Send undefined if 0 or null to let backend fetch price
                message: "Manual signal triggered from UI",
            };

            const response = await axios.post(webhookUrl, payload);
            return response.data;
        },
        onSuccess: (data) => {
            toast.success("Signal sent successfully!");
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
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center space-x-2">
                        <Send className="h-5 w-5" />
                        <span>Manual Signal Trigger</span>
                    </DialogTitle>
                    <DialogDescription>
                        Manually trigger a trade signal for {bot.name}.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="action"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Action</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select action" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="ENTER_LONG">
                                                <div className="flex items-center text-green-600">
                                                    <TrendingUp className="mr-2 h-4 w-4" />
                                                    ENTER LONG (Buy)
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="EXIT_LONG">
                                                <div className="flex items-center text-red-600">
                                                    <TrendingDown className="mr-2 h-4 w-4" />
                                                    EXIT LONG (Sell)
                                                </div>
                                            </SelectItem>
                                            {bot.accountType === "MARGIN" && (
                                                <>
                                                    <SelectItem value="ENTER_SHORT">
                                                        <div className="flex items-center text-orange-600">
                                                            <TrendingDown className="mr-2 h-4 w-4" />
                                                            ENTER SHORT
                                                        </div>
                                                    </SelectItem>
                                                    <SelectItem value="EXIT_SHORT">
                                                        <div className="flex items-center text-blue-600">
                                                            <TrendingUp className="mr-2 h-4 w-4" />
                                                            EXIT SHORT
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

                        <FormField
                            control={form.control}
                            name="symbol"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Symbol</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select symbol" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {bot.symbols.map((symbol) => (
                                                <SelectItem key={symbol} value={symbol}>
                                                    {symbol}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormDescription>
                                        Only configured symbols are available.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="price"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Price (Optional)</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            placeholder="Leave empty for market price"
                                            {...field}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                field.onChange(val === "" ? undefined : Number(val));
                                            }}
                                            value={field.value ?? ""}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        If empty, the current market price will be fetched.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex justify-end space-x-2 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <Send className="mr-2 h-4 w-4" />
                                        Send Signal
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
