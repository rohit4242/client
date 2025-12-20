"use client";

import { Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    FormField,
    FormItem,
    FormLabel,
    FormControl,
    FormDescription,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { CreateBotInput } from "@/features/signal-bot";

interface RiskManagementCardProps {
    form: UseFormReturn<CreateBotInput>;
}

export function RiskManagementCard({ form }: RiskManagementCardProps) {
    return (
        <Card>
            <CardHeader className="pb-4 border-b bg-muted/10">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Shield className="h-5 w-5 text-primary" />
                    Risk Management
                </CardTitle>
                <CardDescription>
                    Set automatic stop loss and take profit levels to protect your capital.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 pt-6">
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="stopLoss"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Stop Loss</FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <Input
                                            type="number"
                                            step="0.1"
                                            min="0.1"
                                            max="50"
                                            className="pr-6 font-mono"
                                            {...field}
                                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                                            value={field.value || ""}
                                            placeholder="2.0"
                                        />
                                        <span className="absolute right-2.5 top-2.5 text-xs text-muted-foreground">%</span>
                                    </div>
                                </FormControl>
                                <FormDescription>
                                    Trigger stop loss at this % drop
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="takeProfit"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Take Profit</FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <Input
                                            type="number"
                                            step="0.1"
                                            min="0.1"
                                            max="100"
                                            className="pr-6 font-mono"
                                            {...field}
                                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                                            value={field.value || ""}
                                            placeholder="4.0"
                                        />
                                        <span className="absolute right-2.5 top-2.5 text-xs text-muted-foreground">%</span>
                                    </div>
                                </FormControl>
                                <FormDescription>
                                    Trigger take profit at this % gain
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/50 p-4 rounded-lg">
                    <div className="flex items-start space-x-3">
                        <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                        <div className="text-sm">
                            <p className="font-medium text-blue-900 dark:text-blue-100">Risk Management Tips</p>
                            <ul className="text-blue-700 dark:text-blue-300 mt-2 space-y-1.5 text-xs">
                                <li className="flex items-center gap-1.5">
                                    <div className="h-1 w-1 rounded-full bg-blue-500" />
                                    Use a 1:2 risk-reward ratio (e.g., 2% SL, 4% TP)
                                </li>
                                <li className="flex items-center gap-1.5">
                                    <div className="h-1 w-1 rounded-full bg-blue-500" />
                                    Never risk more than 2-5% of your portfolio per trade
                                </li>
                                <li className="flex items-center gap-1.5">
                                    <div className="h-1 w-1 rounded-full bg-blue-500" />
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
