"use client";

import { useState } from "react";
import {
    Bot,
    Settings,
    Trash2,
    Link,
    TrendingUp,
    Activity,
    DollarSign,
    Shield,
    MousePointerClick
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
    useToggleBotMutation,
    useDeleteBotMutation,
    type BotWithExchange
} from "@/features/signal-bot";

// Reuse Admin dialogs for consistency and efficiency
import { EditBotDialog } from "@/app/(admin)/signal-bot/_components/dialogs/edit-bot-dialog";
import { DeleteBotDialog } from "@/app/(admin)/signal-bot/_components/dialogs/delete-bot-dialog";
import { WebhookInfoDialog } from "@/app/(admin)/signal-bot/_components/dialogs/webhook-info-dialog";
import { CreateSignalDialog } from "@/app/(admin)/signal-bot/_components/dialogs/create-signal-dialog";

interface SignalBotCardProps {
    bot: BotWithExchange;
}

export function SignalBotCard({ bot }: SignalBotCardProps) {
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showWebhookDialog, setShowWebhookDialog] = useState(false);
    const [showManualSignalDialog, setShowManualSignalDialog] = useState(false);

    const toggleMutation = useToggleBotMutation();

    const handleToggle = () => {
        toggleMutation.mutate({ id: bot.id, isActive: !bot.isActive });
    };

    const winRate = bot.totalTrades > 0
        ? (bot.winTrades / bot.totalTrades) * 100
        : 0;

    return (
        <>
            <Card className={`${bot.isActive ? 'border-teal-200 dark:border-teal-800' : 'border-slate-200 dark:border-slate-800'} transition-all hover:shadow-md bg-card`}>
                <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className={`rounded-xl p-2.5 ${bot.isActive ? 'bg-teal-50 dark:bg-teal-950/30' : 'bg-slate-100 dark:bg-slate-800'}`}>
                                <Bot className={`h-6 w-6 ${bot.isActive ? 'text-teal-600 dark:text-teal-400' : 'text-slate-600 dark:text-slate-400'}`} />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-lg leading-tight">{bot.name}</h3>
                                    <Badge variant={bot.isActive ? "default" : "secondary"} className="h-5 px-1.5 text-[10px] uppercase tracking-wider">
                                        {bot.isActive ? "Active" : "Paused"}
                                    </Badge>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-1.5 font-medium">
                                    {bot.symbols.map(symbol => (
                                        <Badge key={symbol} variant="outline" className="h-5 px-1.5 bg-slate-50/50 dark:bg-slate-900/50">{symbol}</Badge>
                                    ))}
                                    <span className="text-slate-300 dark:text-slate-700">|</span>
                                    <span>
                                        {bot.tradeAmountType === "QUOTE" ? `$${bot.tradeAmount}` : `${bot.tradeAmount} units`}
                                    </span>
                                    {bot.leverage > 1 && (
                                        <>
                                            <span className="text-slate-300 dark:text-slate-700">|</span>
                                            <span className="text-indigo-600 dark:text-indigo-400">{bot.leverage}x Leverage</span>
                                        </>
                                    )}
                                    <Badge variant="outline" className="h-5 border-slate-300 dark:border-slate-700">
                                        {bot.accountType}
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center space-x-3">
                            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 px-2 py-1 rounded-lg border border-slate-100 dark:border-slate-800">
                                <span className="text-[10px] font-bold uppercase text-slate-500">Status</span>
                                <Switch
                                    checked={bot.isActive}
                                    onCheckedChange={handleToggle}
                                    disabled={toggleMutation.isPending}
                                />
                            </div>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-9 w-9">
                                        <Settings className="h-4 w-4 text-slate-500" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                    <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                                        <Settings className="h-4 w-4 mr-2" /> Edit Configuration
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setShowWebhookDialog(true)}>
                                        <Link className="h-4 w-4 mr-2" /> Webhook Alerts
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setShowManualSignalDialog(true)}>
                                        <MousePointerClick className="h-4 w-4 mr-2" /> Execute Manual
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => setShowDeleteDialog(true)}
                                        className="text-rose-600 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-950/30"
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" /> Delete Bot
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </CardHeader>

                <CardContent>
                    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                        <BotStatItem
                            icon={Activity}
                            value={bot.totalTrades}
                            label="Trades"
                            subValue={`${bot.winTrades}W / ${bot.lossTrades}L`}
                            color="blue"
                        />
                        <BotStatItem
                            icon={TrendingUp}
                            value={`${winRate.toFixed(1)}%`}
                            label="Win Rate"
                            subValue={bot.totalVolume > 0 ? `$${bot.totalVolume.toLocaleString()} vol` : "No Volume"}
                            color="emerald"
                        />
                        <BotStatItem
                            icon={DollarSign}
                            value={formatCurrency(bot.totalPnl)}
                            label="Total P&L"
                            subValue={bot.totalPnl >= 0 ? "Profitable" : "In Loss"}
                            color={bot.totalPnl >= 0 ? "teal" : "rose"}
                            valueClassName={bot.totalPnl >= 0 ? "text-teal-600" : "text-rose-600"}
                        />
                        <BotStatItem
                            icon={Shield}
                            value={bot.stopLoss ? `${bot.stopLoss}%` : 'Off'}
                            label="Stop Loss"
                            subValue={bot.takeProfit ? `TP: ${bot.takeProfit}%` : "No TP set"}
                            color="orange"
                        />
                    </div>

                    {bot.exchange && (
                        <div className="mt-5 p-3.5 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center border border-slate-100 dark:border-slate-700 text-xs font-bold shadow-sm">
                                    EX
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300 capitalize">{bot.exchange.name} Portfolio</p>
                                    <p className="text-[10px] text-muted-foreground mt-0.5">Connected to API Manager</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Estimated Balance</p>
                                <p className="text-sm font-mono font-bold text-slate-700 dark:text-slate-200">
                                    {bot.accountType === "SPOT"
                                        ? formatCurrency(bot.exchange.spotValue || 0)
                                        : formatCurrency(bot.exchange.marginValue || 0)
                                    }
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            <span className="flex items-center gap-1.5">
                                <Activity className="h-3 w-3" /> {bot.orderType}
                            </span>
                            {bot.marginType && (
                                <span className="flex items-center gap-1.5">
                                    <Shield className="h-3 w-3" /> {bot.marginType}
                                </span>
                            )}
                        </div>
                        <span className="text-[10px] text-muted-foreground font-medium italic">
                            Configured {formatDate(new Date(bot.createdAt))}
                        </span>
                    </div>
                </CardContent>
            </Card>

            <EditBotDialog
                bot={bot}
                open={showEditDialog}
                onOpenChange={setShowEditDialog}
            />

            <DeleteBotDialog
                bot={bot}
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
            />

            <WebhookInfoDialog
                bot={bot}
                open={showWebhookDialog}
                onOpenChange={setShowWebhookDialog}
            />

            <CreateSignalDialog
                open={showManualSignalDialog}
                onOpenChange={setShowManualSignalDialog}
                userId={bot.portfolioId}
                bots={[bot]}
                onSuccess={() => setShowManualSignalDialog(false)}
            />
        </>
    );
}

function BotStatItem({ icon: Icon, value, label, subValue, color, valueClassName }: any) {
    const colors: any = {
        blue: "bg-blue-50/50 text-blue-600 border-blue-100 dark:bg-blue-950/20 dark:border-blue-900/30",
        emerald: "bg-emerald-50/50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/30",
        teal: "bg-teal-50/50 text-teal-600 border-teal-100 dark:bg-teal-950/20 dark:border-teal-900/30",
        rose: "bg-rose-50/50 text-rose-600 border-rose-100 dark:bg-rose-950/20 dark:border-rose-950/30",
        orange: "bg-orange-50/50 text-orange-600 border-orange-100 dark:bg-orange-950/20 dark:border-orange-900/30",
        slate: "bg-slate-50/50 text-slate-600 border-slate-100 dark:bg-slate-950/20 dark:border-slate-900/30",
    };

    return (
        <div className={`flex flex-col p-3 rounded-xl border ${colors[color] || colors.slate} transition-all hover:scale-[1.02]`}>
            <div className="flex items-center justify-between mb-1.5">
                <Icon className="h-4 w-4 opacity-70" />
                <span className={`text-lg font-black tracking-tight ${valueClassName || ''}`}>{value}</span>
            </div>
            <p className="text-[10px] font-bold uppercase tracking-wider opacity-60">{label}</p>
            <p className="text-[10px] font-medium mt-0.5 opacity-80">{subValue}</p>
        </div>
    );
}
