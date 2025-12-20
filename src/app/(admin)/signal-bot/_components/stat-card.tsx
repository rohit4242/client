"use client";

import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    subValue?: string;
    trend?: "up" | "down" | "neutral";
}

export function StatCard({ title, value, icon: Icon, subValue, trend }: StatCardProps) {
    return (
        <Card className="overflow-hidden border-slate-200/60 bg-white shadow-sm transition-all hover:shadow-md group">
            <CardContent className="p-4">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            {title}
                        </p>
                        <div className={cn(
                            "text-2xl font-black tracking-tighter",
                            trend === "up" ? "text-emerald-600" : trend === "down" ? "text-rose-600" : "text-slate-900"
                        )}>
                            {value}
                        </div>
                    </div>
                    <div className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-300 group-hover:scale-110",
                        trend === "up"
                            ? "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white"
                            : trend === "down"
                                ? "bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white"
                                : "bg-teal-50 text-teal-600 group-hover:bg-teal-600 group-hover:text-white"
                    )}>
                        <Icon className="h-6 w-6" />
                    </div>
                </div>

                {subValue && (
                    <div className="mt-4 flex items-center gap-2">
                        <div className={cn(
                            "h-1 w-1 rounded-full animate-pulse",
                            trend === "up" ? "bg-emerald-500" : trend === "down" ? "bg-rose-500" : "bg-teal-500"
                        )} />
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                            {subValue}
                        </p>
                    </div>
                )}
            </CardContent>

            {/* Bottom Accent Line */}
            <div className={cn(
                "h-1 w-full opacity-20",
                trend === "up" ? "bg-emerald-500" : trend === "down" ? "bg-rose-500" : "bg-teal-500"
            )} />
        </Card>
    );
}
