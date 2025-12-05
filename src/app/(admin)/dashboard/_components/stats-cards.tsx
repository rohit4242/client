"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Wallet, Activity, Calendar } from "lucide-react";
import { DashboardStats, formatCurrency, formatPercentage } from "./dashboard-client";

interface StatsCardsProps {
  stats: DashboardStats | null;
}

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
      {/* Portfolio Value */}
      <Card className="overflow-hidden border-slate-200 shadow-md hover:shadow-lg transition-all duration-200 rounded-xl">
        <div className="h-1.5 w-full bg-gradient-to-r from-teal-400 via-teal-500 to-teal-600" />
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-5">
          <CardTitle className="text-sm font-bold text-slate-900">Portfolio Value</CardTitle>
          <div className="p-2 bg-teal-50 rounded-lg">
            <Wallet className="h-5 w-5 text-teal-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-slate-900">
            {formatCurrency(stats?.totalPortfolioValue || 0)}
          </div>
          <p className="text-sm text-slate-600 mt-1 font-medium">
            Total account value
          </p>
        </CardContent>
      </Card>

      {/* Total P&L */}
      <Card className="overflow-hidden border-slate-200 shadow-md hover:shadow-lg transition-all duration-200 rounded-xl">
        <div className={`h-1.5 w-full ${((stats?.totalPnL || 0) >= 0) ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gradient-to-r from-red-400 to-rose-500'}`} />
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-5">
          <CardTitle className="text-sm font-bold text-slate-900">Total P&L</CardTitle>
          <div className={`p-2 rounded-lg ${(stats?.totalPnL || 0) >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
            {(stats?.totalPnL || 0) >= 0 ? (
              <TrendingUp className="h-5 w-5 text-green-600" />
            ) : (
              <TrendingDown className="h-5 w-5 text-red-600" />
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className={`text-3xl font-bold ${(stats?.totalPnL || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(stats?.totalPnL || 0)}
          </div>
          <p className="text-sm text-slate-600 mt-1 font-medium">
            {formatPercentage(stats?.totalPnLPercent || 0)}
          </p>
        </CardContent>
      </Card>

      {/* Today's P&L */}
      <Card className="overflow-hidden border-slate-200 shadow-md hover:shadow-lg transition-all duration-200 rounded-xl">
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500" />
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-5">
          <CardTitle className="text-sm font-bold text-slate-900">Today&apos;s P&L</CardTitle>
          <div className="p-2 bg-indigo-50 rounded-lg">
            <Calendar className="h-5 w-5 text-indigo-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className={`text-3xl font-bold ${(stats?.todayPnL || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(stats?.todayPnL || 0)}
          </div>
          <p className="text-sm text-slate-600 mt-1 font-medium">
            {formatPercentage(stats?.todayPnLPercent || 0)}
          </p>
        </CardContent>
      </Card>

      {/* Active Positions */}
      <Card className="overflow-hidden border-slate-200 shadow-md hover:shadow-lg transition-all duration-200 rounded-xl">
        <div className="h-1.5 w-full bg-gradient-to-r from-cyan-400 via-teal-500 to-emerald-500" />
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-5">
          <CardTitle className="text-sm font-bold text-slate-900">Active Positions</CardTitle>
          <div className="p-2 bg-cyan-50 rounded-lg">
            <Activity className="h-5 w-5 text-cyan-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-slate-900">{stats?.openPositions || 0}</div>
          <p className="text-sm text-slate-600 mt-1 font-medium">
            Open positions
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
