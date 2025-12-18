/**
 * Position Card Component
 * 
 * The primary container for detailed position information.
 * Combines stats, specialized order info, and a live order history table.
 */

"use client";

import { usePositionOrdersQuery } from "@/features/order";
import { PositionWithRelations } from "@/features/position";
import { PositionOrderDetails } from "./position-order-details";
import { MarginStat, PnlStat, PriceStat, RiskIndicator, StatItem } from "./position-stats";
import { OrderHistory } from "./order-history";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Copy, Bot, ShieldCheck, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PositionCardProps {
    position: PositionWithRelations;
}

export function PositionCard({ position }: PositionCardProps) {
    // Fetch real-time orders for this position
    const { data: orderData, isLoading: ordersLoading } = usePositionOrdersQuery(position.id);
    const orders = orderData?.orders ?? [];

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`${label} copied to clipboard`);
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Header / Meta Section */}
            <div className="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                        <Activity className="size-5" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-slate-900">{position.symbol}</h3>
                            <Badge variant="secondary" className="text-[10px] font-bold h-5 uppercase tracking-wider">
                                {position.accountType}
                            </Badge>
                        </div>
                        <p className="text-xs text-slate-500 font-medium">{position.exchange.name}</p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    {position.bot && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-100">
                            <Bot className="size-4 text-emerald-600" />
                            <div className="flex flex-col">
                                <span className="text-[10px] uppercase font-bold text-slate-400 leading-none">Bot Managed</span>
                                <span className="text-xs font-semibold text-slate-700">{position.bot.name}</span>
                            </div>
                        </div>
                    )}
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Position ID</span>
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs font-mono text-slate-600 truncate max-w-[100px]">{position.id}</span>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-5 w-5 p-0 text-slate-400 hover:text-slate-600"
                                onClick={() => copyToClipboard(position.id, "Position ID")}
                            >
                                <Copy className="size-3" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-6 space-y-8">
                {/* Main Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <PnlStat
                        label="ROI / P&L"
                        amount={position.pnlDisplay}
                        percent={position.roiPercent}
                    />
                    <PriceStat label="Entry Price" price={position.entryPrice} precision={4} />
                    <PriceStat label="Current Price" price={position.currentPrice ?? position.entryPrice} precision={4} />

                    {/* Margin & Leverage */}
                    <MarginStat
                        leverage={position.leverage}
                        borrowedAmount={position.borrowedAmount}
                        borrowedAsset={position.borrowedAsset}
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Risk Management Section */}
                    <div className="space-y-4 p-5 bg-slate-50/50 rounded-2xl border border-slate-100">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="size-4 text-emerald-600" />
                            <h4 className="text-sm font-bold text-slate-800 tracking-tight">Risk Management</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <RiskIndicator
                                label="Stop Loss"
                                value={position.stopLoss ? `$${position.stopLoss.toFixed(4)}` : null}
                                status={position.stopLossStatus}
                            />
                            <RiskIndicator
                                label="Take Profit"
                                value={position.takeProfit ? `$${position.takeProfit.toFixed(4)}` : null}
                                status={position.takeProfitStatus}
                            />
                        </div>
                    </div>

                    {/* Metadata Section */}
                    <div className="space-y-4 p-5 bg-slate-50/50 rounded-2xl border border-slate-100">
                        <div className="flex items-center gap-2">
                            <Bot className="size-4 text-indigo-600" />
                            <h4 className="text-sm font-bold text-slate-800 tracking-tight">System & Automation</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <StatItem
                                label="Source"
                                value={position.bot ? "Bot Managed" : "Manual Trade"}
                                color={position.bot ? "text-indigo-600" : "text-slate-600"}
                            />
                            <StatItem
                                label="Account Type"
                                value={`${position.accountType} ${position.marginType ? `(${position.marginType})` : ""}`}
                            />
                        </div>
                    </div>
                </div>

                <Separator className="bg-slate-100" />

                {/* Entry / Exit Detail Section */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 px-1">
                        <Activity className="size-4 text-orange-500" />
                        <h4 className="text-sm font-bold text-slate-800">Trade Timeline & Execution</h4>
                    </div>
                    <PositionOrderDetails
                        entryPrice={position.entryPrice}
                        openedAt={position.openedAt}
                        exitPrice={position.exitPrice}
                        closedAt={position.closedAt}
                        quantity={position.quantity}
                        status={position.status}
                        side={position.side}
                    />
                </div>

                {/* Order History Table */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-2">
                            <Activity className="size-4 text-slate-400" />
                            <h4 className="text-sm font-bold text-slate-800">Live Order History</h4>
                        </div>
                        {ordersLoading && (
                            <span className="text-xs text-slate-400 animate-pulse font-medium">Synchronizing with exchange...</span>
                        )}
                    </div>
                    {/* Map OrderClient fields to PositionOrder expected by OrderHistory */}
                    <OrderHistory
                        orders={orders.map(o => {
                            const order = o as any;
                            const amount = order.quantity || 0;
                            const filled = order.executedQty || 0;
                            return {
                                ...order,
                                amount: amount,
                                filled: filled,
                                remaining: Math.max(0, amount - filled),
                                fill: order.fillPercent || (amount > 0 ? (filled / amount) * 100 : 0),
                                lastUpdatedAt: order.updatedAt || order.lastUpdatedAt || new Date().toISOString(),
                                averagePrice: order.avgPrice || order.averagePrice || 0,
                                fees: order.commission || order.fees || 0,
                                volume: order.value || order.volume || 0
                            };
                        }) as any}
                        loading={ordersLoading}
                    />
                </div>
            </div>

            {/* Footer Summary */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                    <div className="flex items-center gap-1.5">
                        <span>Side:</span>
                        <span className={cn(position.side === "LONG" ? "text-emerald-600" : "text-red-600", "font-bold")}>
                            {position.side}
                        </span>
                    </div>
                    <span>•</span>
                    <span>System: {position.sideEffectType}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Total Volume</span>
                    <span className="text-sm font-bold text-slate-900 font-mono">
                        ${(position.entryPrice * position.quantity).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                </div>
            </div>
        </div>
    );
}
