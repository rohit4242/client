"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { BotWithExchange, useToggleBotMutation } from "@/features/signal-bot";
import { Bot, Globe, Activity, TrendingUp, DollarSign, Edit, Trash2, Link, Zap, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { formatCurrency, cn } from "@/lib/utils";
import { toast } from "sonner";
import {
    EditSignalBotDialog,
    DeleteSignalBotDialog,
    WebhookInfoDialog,
    ManualSignalDialog
} from "../index";

interface SignalBotListItemProps {
    bot: BotWithExchange;
    onBotUpdated: () => void;
    userId: string;
}

export function SignalBotListItem({ bot, onBotUpdated, userId }: SignalBotListItemProps) {
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showWebhookDialog, setShowWebhookDialog] = useState(false);
    const [showManualSignalDialog, setShowManualSignalDialog] = useState(false);

    const toggleBotMutation = useToggleBotMutation();
    const winRate = bot.totalTrades > 0 ? (bot.winTrades / bot.totalTrades) * 100 : 0;

    const handleToggle = async () => {
        const action = toggleBotMutation.mutateAsync({
            id: bot.id,
            isActive: !bot.isActive
        });

        toast.promise(action, {
            loading: `${bot.isActive ? 'Deactivating' : 'Activating'} bot ${bot.name}...`,
            success: () => {
                onBotUpdated();
                return `${bot.name} ${bot.isActive ? 'deactivated' : 'activated'} successfully.`;
            },
            error: (err) => `Failed to toggle bot: ${err.message}`
        });
    };

    return (
        <>
            <Card className={cn(
                "group relative overflow-hidden transition-all duration-200 hover:shadow-md border-slate-200/60",
                bot.isActive ? "bg-white" : "bg-slate-50/50 grayscale-[0.3]"
            )}>
                <CardContent className="p-3">
                    <div className="flex items-center gap-4">
                        {/* Status & Icon */}
                        <div className="relative">
                            <div className={cn(
                                "flex size-10 items-center justify-center rounded-xl transition-colors",
                                bot.isActive ? "bg-teal-100/80 text-teal-600" : "bg-slate-200 text-slate-500"
                            )}>
                                <Bot className="size-5" />
                            </div>
                            {bot.isActive && (
                                <div className="absolute -top-1 -right-1 size-3 rounded-full bg-emerald-500 border-2 border-white animate-pulse" />
                            )}
                        </div>

                        {/* Name & Symbols */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                                <h3 className="font-bold text-slate-900 truncate text-sm">{bot.name}</h3>
                                <Badge variant="outline" className="text-[9px] font-black uppercase py-0 h-4 border-slate-200 bg-slate-50 text-slate-600">
                                    {bot.orderType}
                                </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                                <span className="flex items-center gap-1">
                                    <Globe className="size-3" />
                                    {bot.exchange?.name || "No Exchange"}
                                </span>
                                <span className="text-slate-300">•</span>
                                <span className="text-teal-600/80">{bot.symbols.join(", ")}</span>
                            </div>
                        </div>

                        {/* Stats Summary - Compact Grid */}
                        <div className="hidden lg:grid grid-cols-3 gap-6 px-4 border-x border-slate-100">
                            <div className="text-center">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Efficiency</p>
                                <p className="text-xs font-black text-slate-700">{winRate.toFixed(1)}%</p>
                            </div>
                            <div className="text-center">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Trades</p>
                                <p className="text-xs font-black text-slate-700">{bot.totalTrades}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Net PnL</p>
                                <p className={cn(
                                    "text-xs font-black",
                                    bot.totalPnl >= 0 ? "text-emerald-600" : "text-rose-600"
                                )}>
                                    {formatCurrency(bot.totalPnl)}
                                </p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                            <Switch
                                checked={bot.isActive}
                                onCheckedChange={handleToggle}
                                disabled={toggleBotMutation.isPending}
                                className="scale-75 data-[state=checked]:bg-teal-600 transition-colors"
                            />

                            <div className="flex items-center gap-1 border-l border-slate-100 pl-2">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg"
                                    onClick={() => setShowWebhookDialog(true)}
                                    title="View Alerts"
                                >
                                    <Shield className="size-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-8 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg"
                                    onClick={() => setShowManualSignalDialog(true)}
                                    title="Manual Signal"
                                >
                                    <Zap className="size-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-8 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg"
                                    onClick={() => setShowEditDialog(true)}
                                    title="Edit Bot"
                                >
                                    <Edit className="size-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                                    onClick={() => setShowDeleteDialog(true)}
                                    title="Delete Bot"
                                >
                                    <Trash2 className="size-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <EditSignalBotDialog
                bot={bot as any}
                open={showEditDialog}
                onOpenChange={setShowEditDialog}
                onSuccess={() => {
                    setShowEditDialog(false);
                    onBotUpdated();
                }}
            />

            <DeleteSignalBotDialog
                bot={bot}
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
                onSuccess={() => {
                    setShowDeleteDialog(false);
                    onBotUpdated();
                }}
            />

            <WebhookInfoDialog
                bot={bot as any}
                open={showWebhookDialog}
                onOpenChange={setShowWebhookDialog}
            />

            <ManualSignalDialog
                open={showManualSignalDialog}
                onOpenChange={setShowManualSignalDialog}
                bot={bot as any}
            />
        </>
    );
}
