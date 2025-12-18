/**
 * Position Stats Components
 * 
 * Reusable components for displaying position-related statistics
 * with consistent styling and color-coding.
 */

"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface StatItemProps {
    label: string;
    value: string | number;
    subValue?: string | number;
    color?: string;
    className?: string;
}

export function StatItem({ label, value, subValue, color, className }: StatItemProps) {
    return (
        <div className={cn("flex flex-col", className)}>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                {label}
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className={cn("text-sm font-semibold font-mono", color)}>
                    {value}
                </span>
                {subValue && (
                    <span className="text-xs text-slate-400 font-mono">
                        ({subValue})
                    </span>
                )}
            </div>
        </div>
    );
}

export function PriceStat({
    label,
    price,
    currency = "$",
    precision = 4
}: {
    label: string;
    price: number | null | undefined;
    currency?: string;
    precision?: number
}) {
    const formattedPrice = price !== null && price !== undefined
        ? `${currency}${price.toFixed(precision)}`
        : "-";

    return <StatItem label={label} value={formattedPrice} />;
}

export function PnlStat({
    label,
    amount,
    percent,
    currency = "$"
}: {
    label: string;
    amount: number;
    percent: number;
    currency?: string;
}) {
    const isPositive = amount > 0;
    const isNegative = amount < 0;
    const color = isPositive ? "text-emerald-600" : isNegative ? "text-red-600" : "text-slate-600";

    const formattedAmount = `${(amount ?? 0) > 0 ? "+" : ""}${new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
    }).format(amount ?? 0)}`;

    const formattedPercent = `${(percent ?? 0) > 0 ? "+" : ""}${(percent ?? 0).toFixed(2)}%`;

    return (
        <StatItem
            label={label}
            value={formattedPercent}
            subValue={formattedAmount}
            color={color}
        />
    );
}

export function RiskIndicator({
    label,
    value,
    status
}: {
    label: string,
    value: string | number | null | undefined,
    status?: string | null
}) {
    const hasValue = value !== null && value !== undefined && value !== 0;
    const isTriggered = status === "FILLED" || status === "COMPLETED";

    return (
        <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                {label}
            </span>
            <div className="flex items-center gap-2 mt-0.5">
                <span className={cn(
                    "text-xs font-mono font-bold",
                    hasValue ? "text-slate-700" : "text-slate-300"
                )}>
                    {hasValue ? value : "Not Set"}
                </span>
                {hasValue && (
                    <Badge variant="outline" className={cn(
                        "text-[9px] h-4 px-1 leading-none font-bold uppercase",
                        isTriggered
                            ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                            : "bg-slate-50 text-slate-500 border-slate-200"
                    )}>
                        {status || "Active"}
                    </Badge>
                )}
            </div>
        </div>
    );
}

export function MarginStat({
    leverage,
    borrowedAmount,
    borrowedAsset
}: {
    leverage: number,
    borrowedAmount?: number,
    borrowedAsset?: string | null
}) {
    return (
        <div className="flex items-center gap-6">
            <StatItem
                label="Leverage"
                value={`${leverage}x`}
                color="text-indigo-600"
            />
            {borrowedAmount && borrowedAmount > 0 && (
                <StatItem
                    label="Borrowed"
                    value={borrowedAmount.toFixed(4)}
                    subValue={borrowedAsset || ""}
                    color="text-slate-700"
                />
            )}
        </div>
    );
}

