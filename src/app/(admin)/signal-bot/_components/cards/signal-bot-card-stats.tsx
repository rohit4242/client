"use client";

import { Activity, TrendingUp, DollarSign, Shield, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { BotWithExchange } from "@/features/signal-bot";
import { formatCurrency, cn } from "@/lib/utils";

interface SignalBotCardStatsProps {
    bot: BotWithExchange;
}

export function SignalBotCardStats({ bot }: SignalBotCardStatsProps) {
    const winRate = bot.totalTrades > 0
        ? ((bot.winTrades || 0) / bot.totalTrades) * 100
        : 0;

    return (
        <div className="grid gap-2 grid-cols-2 mt-4">
            {/* Total Trades */}
            <div className="flex flex-col p-3 rounded-xl bg-slate-50 border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                <div className="flex items-center justify-between mb-2">
                    <div className="p-1.5 rounded-lg bg-teal-100 text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                        <Activity className="h-4 w-4" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total</span>
                </div>
                <p className="text-xl font-black text-slate-900 leading-none mb-1">{bot.totalTrades}</p>
                <div className="flex items-center gap-1.5 mt-auto">
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded uppercase tracking-wider">{bot.winTrades}W</span>
                    <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded uppercase tracking-wider">{bot.lossTrades || 0}L</span>
                </div>
            </div>

            {/* Win Rate */}
            <div className="flex flex-col p-3 rounded-xl bg-slate-50 border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                <div className="flex items-center justify-between mb-2">
                    <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                        <TrendingUp className="h-4 w-4" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Efficiency</span>
                </div>
                <p className="text-xl font-black text-slate-900 leading-none mb-1">{winRate.toFixed(1)}%</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">
                    Vol: ${bot.totalVolume > 1000 ? `${(bot.totalVolume / 1000).toFixed(1)}K` : bot.totalVolume.toFixed(0)}
                </p>
            </div>

            {/* Total P&L */}
            <div className={cn(
                "flex flex-col p-3 rounded-xl border shadow-sm hover:shadow-md transition-all group",
                bot.totalPnl >= 0
                    ? 'bg-emerald-50/50 border-emerald-100'
                    : 'bg-rose-50/50 border-rose-100'
            )}>
                <div className="flex items-center justify-between mb-2">
                    <div className={cn(
                        "p-1.5 rounded-lg transition-colors",
                        bot.totalPnl >= 0
                            ? 'bg-emerald-100 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white'
                            : 'bg-rose-100 text-rose-600 group-hover:bg-rose-600 group-hover:text-white'
                    )}>
                        <DollarSign className="h-4 w-4" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Net Profit</span>
                </div>
                <div className="flex items-center gap-1 mb-1">
                    <p className={cn(
                        "text-xl font-black leading-none",
                        bot.totalPnl >= 0 ? 'text-emerald-700' : 'text-rose-700'
                    )}>
                        {formatCurrency(bot.totalPnl)}
                    </p>
                    {bot.totalPnl !== 0 && (
                        bot.totalPnl > 0
                            ? <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                            : <ArrowDownRight className="h-4 w-4 text-rose-500" />
                    )}
                </div>
                {bot.accountType === "MARGIN" && bot.totalInterest > 0 && (
                    <p className="text-[10px] font-bold text-orange-600 uppercase tracking-wider">
                        Int: ${bot.totalInterest.toFixed(2)}
                    </p>
                )}
            </div>

            {/* Risk Management */}
            <div className="flex flex-col p-3 rounded-xl bg-slate-50 border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                <div className="flex items-center justify-between mb-2">
                    <div className="p-1.5 rounded-lg bg-orange-100 text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                        <Shield className="h-4 w-4" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Safety</span>
                </div>
                <p className="text-xl font-black text-slate-900 leading-none mb-1">
                    {bot.stopLoss ? `${bot.stopLoss}%` : 'Off'}
                </p>
                {bot.takeProfit && (
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">
                        TP Stage: {bot.takeProfit}%
                    </p>
                )}
            </div>
        </div>
    );
}
