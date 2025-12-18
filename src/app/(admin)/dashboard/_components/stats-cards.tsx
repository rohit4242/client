"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Wallet, Activity, DollarSign, PieChart } from "lucide-react";
import { DashboardStats, formatCurrency, formatPercentage } from "./dashboard-client";
import { DateRange } from "react-day-picker";

interface StatsCardsProps {
  stats: DashboardStats | null;
  date?: DateRange;
}

export function StatsCards({ stats, date }: StatsCardsProps) {
  const isFiltered = !!date?.from;

  // PERIOD / TOTAL P&L Config
  const pnlTitle = isFiltered ? "Period Realized P&L" : "Total Realized P&L";
  const pnlValue = isFiltered ? stats?.periodPnl : stats?.totalPnL;
  const pnlPercent = isFiltered ? stats?.periodPnlPercent : stats?.totalPnLPercent;

  // UNREALIZED P&L (Floating PnL)
  const unrealizedPnL = stats?.unrealizedPnL || 0;

  return (
    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
      {/* 1. Total Balance Card */}
      <Card className="relative overflow-hidden border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Wallet className="h-24 w-24 text-teal-600" />
        </div>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-slate-500">Total Balance</CardTitle>
          <Wallet className="h-4 w-4 text-teal-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-900">
            {formatCurrency(stats?.totalPortfolioValue || 0)}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Across all active exchanges
          </p>
        </CardContent>
      </Card>

      {/* 2. Realized P&L Card */}
      <Card className="relative overflow-hidden border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <DollarSign className="h-24 w-24 text-blue-600" />
        </div>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-slate-500">{pnlTitle}</CardTitle>
          {(pnlValue || 0) >= 0 ? (
            <TrendingUp className="h-4 w-4 text-green-600" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-600" />
          )}
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${(pnlValue || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(pnlValue || 0)}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {formatPercentage(pnlPercent || 0)} return
          </p>
        </CardContent>
      </Card>

      {/* 3. Unrealized P&L Card (New Metric) */}
      <Card className="relative overflow-hidden border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <PieChart className="h-24 w-24 text-purple-600" />
        </div>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-slate-500">Unrealized P&L</CardTitle>
          {(unrealizedPnL) >= 0 ? (
            <TrendingUp className="h-4 w-4 text-green-600" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-600" />
          )}
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${(unrealizedPnL) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(unrealizedPnL)}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Floating profit/loss
          </p>
        </CardContent>
      </Card>

      {/* 4. Active Positions Card */}
      <Card className="relative overflow-hidden border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Activity className="h-24 w-24 text-orange-600" />
        </div>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-slate-500">Active Positions</CardTitle>
          <Activity className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-900">
            {stats?.openPositions || 0}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Open trades running
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
