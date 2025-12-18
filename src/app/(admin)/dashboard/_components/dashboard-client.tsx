"use client";

import { DashboardHeader } from "./dashboard-header";
import { StatsCards } from "./stats-cards";
import { PortfolioChart } from "./portfolio-chart";
import { RecentOrders } from "./recent-orders";
import { SignalBotWidget } from "./signal-bot-widget";
import { useSelectedUser } from "@/contexts/selected-user-context";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

import { DateRange } from "react-day-picker";
import { useState } from "react";
import { addDays, subDays } from "date-fns";

// Real dashboard stats type based on portfolio data
export interface DashboardStats {
    totalPortfolioValue: number;
    totalPnL: number;
    totalPnLPercent: number;
    todayPnL: number;
    todayPnLPercent: number;
    openPositions: number;
    winRate?: number;
    periodPnl?: number;
    periodPnlPercent?: number;
    unrealizedPnL?: number;
}

// Helper functions for formatting
export const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
    }).format(value);
};

export const formatPercentage = (value: number) => {
    const sign = value >= 0 ? "+" : "";
    return `${sign}${value.toFixed(2)}%`;
};

export function DashboardClient() {
    const { selectedUser } = useSelectedUser();
    const [date, setDate] = useState<DateRange | undefined>({
        from: subDays(new Date(), 30),
        to: new Date(),
    });

    // Fetch real portfolio stats for selected user
    const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats | null>({
        queryKey: ["admin-dashboard-stats", selectedUser?.id, date?.from, date?.to],
        queryFn: async () => {
            if (!selectedUser?.id) return null;

            const params = new URLSearchParams();
            if (date?.from) params.append("from", date.from.toISOString());
            if (date?.to) params.append("to", date.to.toISOString());

            const response = await axios.get(`/api/admin/users/${selectedUser.id}/portfolio-stats?${params.toString()}`);
            const data = response.data;

            if (!data.success) return null;

            return {
                totalPortfolioValue: data.stats?.currentBalance || 0,
                totalPnL: data.stats?.totalPnl || 0,
                totalPnLPercent: data.stats?.totalPnlPercent || 0,
                todayPnL: data.stats?.dailyPnl || 0,
                todayPnLPercent: data.stats?.dailyPnl && data.stats?.initialBalance
                    ? (data.stats.dailyPnl / data.stats.initialBalance) * 100
                    : 0,
                openPositions: data.stats?.activeTrades || 0,
                winRate: data.stats?.winRate || 0,
                periodPnl: data.stats?.periodPnl,
                periodPnlPercent: data.stats?.periodPnlPercent,
                unrealizedPnL: data.stats?.unrealizedPnL || 0,
            };
        },
        enabled: !!selectedUser?.id,
        refetchInterval: 30000, // Poll every 30 seconds
        staleTime: 10000,
    });

    if (!selectedUser) {
        return (
            <div className="space-y-6">
                <div className="text-center py-12">
                    <h2 className="text-xl font-semibold text-slate-800">No User Selected</h2>
                    <p className="text-muted-foreground mt-2">
                        Please select a user from the dropdown to view their dashboard
                    </p>
                </div>
            </div>
        );
    }

    if (statsLoading) {
        return (
            <div className="space-y-6">
                <DashboardHeader userName={selectedUser.name} date={date} setDate={setDate} />
                <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Card key={i} className="overflow-hidden">
                            <CardHeader className="pb-2">
                                <Skeleton className="h-4 w-24" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-8 w-32" />
                                <Skeleton className="h-4 w-20 mt-2" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <DashboardHeader userName={selectedUser.name} date={date} setDate={setDate} />

            <StatsCards stats={stats ?? null} date={date} />

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                    <PortfolioChart userId={selectedUser.id} date={date} />
                </div>
                <div className="space-y-6">
                    <SignalBotWidget />
                    <RecentOrders userId={selectedUser.id} />
                </div>
            </div>
        </div>
    );
}
