"use client";

import { Bot, Settings, Link, MousePointerClick, Trash2, Globe, Shield, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { BotWithExchange } from "@/features/signal-bot";
import { BotStatusBadge } from "../bot-status-badge";
import { cn } from "@/lib/utils";

interface SignalBotCardHeaderProps {
    bot: BotWithExchange;
    onToggle: () => void;
    isToggling: boolean;
    onEdit: () => void;
    onDelete: () => void;
    onWebhook: () => void;
    onManualSignal: () => void;
}

export function SignalBotCardHeader({
    bot,
    onToggle,
    isToggling,
    onEdit,
    onDelete,
    onWebhook,
    onManualSignal
}: SignalBotCardHeaderProps) {
    return (
        <div className="flex items-center justify-between gap-3">
            <div className="flex items-center space-x-2.5 overflow-hidden">
                <div className={cn(
                    "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl shadow-sm transition-colors",
                    bot.isActive
                        ? 'bg-teal-100/80 text-teal-600'
                        : 'bg-slate-100 text-slate-400'
                )}>
                    <Bot className="h-6 w-6" />
                </div>

                <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-lg text-slate-900 truncate tracking-tight">{bot.name}</h3>
                        <BotStatusBadge active={bot.isActive} />
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 overflow-hidden">
                        {bot.symbols.slice(0, 2).map(symbol => (
                            <Badge key={symbol} variant="secondary" className="px-1.5 py-0 h-5 text-[10px] font-bold bg-slate-100 text-slate-700 border-none uppercase">
                                {symbol}
                            </Badge>
                        ))}
                        {bot.symbols.length > 2 && (
                            <Badge variant="outline" className="px-1.5 py-0 h-5 text-[10px] font-medium border-slate-200">
                                +{bot.symbols.length - 2}
                            </Badge>
                        )}

                        <span className="text-slate-300 mx-0.5">•</span>

                        <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-600">
                            <Wallet className="h-3 w-3 text-slate-400" />
                            <span>
                                {bot.tradeAmountType === "QUOTE"
                                    ? `$${bot.tradeAmount?.toLocaleString() || 0}`
                                    : `${bot.tradeAmount?.toFixed(6) || 0}`}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
                <div className="flex flex-col items-end gap-1.5 mr-1">
                    <Badge
                        variant="outline"
                        className={cn(
                            "px-1.5 py-0 h-5 text-[10px] uppercase font-bold tracking-wider",
                            bot.accountType === "MARGIN"
                                ? "border-orange-200 bg-orange-50 text-orange-700"
                                : "border-emerald-200 bg-emerald-50 text-emerald-700"
                        )}
                    >
                        {bot.accountType}
                    </Badge>

                    <Switch
                        checked={bot.isActive}
                        onCheckedChange={onToggle}
                        disabled={isToggling}
                        className="scale-90 data-[state=checked]:bg-teal-600"
                    />
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg hover:bg-slate-100 text-slate-500"
                        >
                            <Settings className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 p-1">
                        <DropdownMenuItem onClick={onEdit} className="rounded-md cursor-pointer">
                            <Settings className="h-4 w-4 mr-2 text-slate-400" />
                            <span>Edit Bot</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={onWebhook} className="rounded-md cursor-pointer">
                            <Globe className="h-4 w-4 mr-2 text-slate-400" />
                            <span>Webhook & Alerts</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={onManualSignal} className="rounded-md cursor-pointer">
                            <MousePointerClick className="h-4 w-4 mr-2 text-slate-400" />
                            <span>Manual Signal</span>
                        </DropdownMenuItem>

                        <DropdownMenuSeparator className="my-1" />

                        <DropdownMenuItem
                            onClick={onDelete}
                            className="rounded-md cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50"
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            <span>Delete Bot</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}
