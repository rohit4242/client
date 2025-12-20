"use client";

import { Link, TrendingDown, Target, Shield, Bot, Layers, Calendar, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BotWithExchange } from "@/features/signal-bot";
import { formatCurrency, formatDate, cn } from "@/lib/utils";

interface SignalBotCardDetailsProps {
    bot: BotWithExchange;
    onWebhook: () => void;
}

export function SignalBotCardDetails({ bot, onWebhook }: SignalBotCardDetailsProps) {
    return (
        <div className="space-y-3 mt-4 border-t border-slate-100 pt-3">
            {/* Exchange & Portfolio Info */}
            {bot.exchange && (
                <div className="p-3 bg-gradient-to-br from-slate-50 to-white rounded-xl border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-teal-50 text-teal-600">
                                <Globe className="h-4 w-4" />
                            </div>
                            <span className="text-sm font-bold text-slate-900">{bot.exchange.name}</span>
                        </div>
                        <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider border-emerald-200 bg-emerald-50 text-emerald-700">
                            Connected
                        </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Active Balance</p>
                            <p className="text-sm font-mono font-bold text-slate-700">
                                {bot.accountType === "SPOT"
                                    ? formatCurrency(bot.exchange?.spotValue ?? 0)
                                    : formatCurrency(bot.exchange?.marginValue ?? 0)
                                }
                            </p>
                        </div>
                        <div className="space-y-1 text-right">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Total Value</p>
                            <p className="text-sm font-mono font-bold text-teal-600">
                                {formatCurrency(bot.exchange?.totalValue ?? 0)}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Trading Configuration */}
            <div className="flex flex-wrap gap-2 items-center justify-between">
                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100/80 text-slate-700 border border-slate-200/50 shadow-sm">
                        <Layers className="h-3.5 w-3.5 text-slate-400" />
                        <span className="text-[11px] font-bold uppercase tracking-wide">{bot.orderType}</span>
                    </div>

                    {bot.accountType === "MARGIN" && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-orange-50 text-orange-700 border border-orange-100/50 shadow-sm">
                            <Shield className="h-3.5 w-3.5 text-orange-400" />
                            <span className="text-[11px] font-bold uppercase tracking-wide">Borrow {bot.maxBorrowPercent}%</span>
                        </div>
                    )}
                </div>

                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onWebhook}
                    className="h-8 text-[11px] font-bold px-3 hover:bg-teal-50 hover:text-teal-600 text-slate-500 transition-all rounded-lg gap-2"
                >
                    <Link className="h-3.5 w-3.5" />
                    Alert Info
                </Button>
            </div>

            {/* Footer Info */}
            <div className="pt-3 border-t border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <span className="flex items-center gap-1.5">
                        <Bot className="h-3 w-3" />
                        V1.2 Engine
                    </span>
                    <span className="flex items-center gap-1.5">
                        <Calendar className="h-3 w-3" />
                        {formatDate(new Date(bot.createdAt))}
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[9px] font-black text-emerald-600 uppercase">Live</span>
                </div>
            </div>
        </div>
    );
}
