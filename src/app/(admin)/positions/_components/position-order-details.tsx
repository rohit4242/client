/**
 * Position Order Details Component
 * 
 * Specialized component for displaying detailed entry and exit information.
 * Extracted for better organization and reusability.
 */

"use client";

import { formatDate } from "@/lib/utils";
import { PriceStat, StatItem } from "./position-stats";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PositionOrderDetailsProps {
    entryPrice: number;
    openedAt: string;
    exitPrice?: number | null;
    closedAt?: string | null;
    quantity: number;
    status: string;
    side: "LONG" | "SHORT";
}

export function PositionOrderDetails({
    entryPrice,
    openedAt,
    exitPrice,
    closedAt,
    quantity,
    status,
    side
}: PositionOrderDetailsProps) {
    const isClosed = status === "CLOSED";

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 p-6 bg-slate-50/40 rounded-2xl border border-slate-100 shadow-sm">
            {/* Entry Group */}
            <div className="relative pl-6 border-l-2 border-emerald-200">
                <div className="absolute -left-[5px] top-0 size-2.5 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.1)]" />
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Initial Entry</h4>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                        <PriceStat label="Entry Price" price={entryPrice} precision={4} />
                        <StatItem
                            label="Execution Time"
                            value={formatDate(new Date(openedAt))}
                        />
                    </div>
                </div>
            </div>

            {/* Exit Group */}
            <div className={cn(
                "relative pl-6 border-l-2",
                isClosed ? "border-orange-200" : "border-slate-200 border-dashed"
            )}>
                <div className={cn(
                    "absolute -left-[5px] top-0 size-2.5 rounded-full",
                    isClosed
                        ? "bg-orange-500 shadow-[0_0_0_3px_rgba(249,115,22,0.1)]"
                        : "bg-slate-300"
                )} />
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <h4 className={cn(
                            "text-[10px] font-black uppercase tracking-widest",
                            isClosed ? "text-orange-600" : "text-slate-400"
                        )}>
                            Exit / Realization
                        </h4>
                    </div>
                    {isClosed ? (
                        <div className="grid grid-cols-1 gap-4">
                            <PriceStat label="Exit Price" price={exitPrice} precision={4} />
                            <StatItem
                                label="Closed At"
                                value={closedAt ? formatDate(new Date(closedAt)) : "-"}
                            />
                        </div>
                    ) : (
                        <div className="py-2">
                            <p className="text-[10px] text-slate-400 font-medium italic bg-slate-100/50 rounded px-2 py-1 inline-block">
                                Position currently active
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Stats Group */}
            <div className="relative pl-6 border-l-2 border-indigo-100">
                <div className="absolute -left-[5px] top-0 size-2.5 rounded-full bg-indigo-500 shadow-[0_0_0_3px_rgba(99,102,241,0.1)]" />
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Size & Exposure</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <StatItem label="Gross Quantity" value={quantity.toFixed(6)} />
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Side</span>
                            <div className="mt-1">
                                <Badge
                                    variant="outline"
                                    className={cn(
                                        "text-[10px] font-bold h-5 px-2",
                                        side === "LONG"
                                            ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                                            : "text-red-700 bg-red-50 border-red-200"
                                    )}
                                >
                                    {side}
                                </Badge>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
