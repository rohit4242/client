"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Wallet, Activity, Calendar } from "lucide-react";
import { DashboardStats, formatCurrency, formatPercentage } from "@/lib/mock-data";

interface StatsCardsProps {
  stats: DashboardStats | null;
}

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Portfolio Value */}
      <Card className="overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-primary/60 via-primary to-primary/60" />
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Portfolio Value</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(stats?.totalPortfolioValue || 0)}
          </div>
          <p className="text-xs text-muted-foreground">
            Total account value
          </p>
        </CardContent>
      </Card>

      {/* Total P&L */}
      <Card className="overflow-hidden">
        <div className={`h-1 w-full ${((stats?.totalPnL || 0) >= 0) ? 'bg-green-500' : 'bg-red-500'}`} />
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total P&L</CardTitle>
          {(stats?.totalPnL || 0) >= 0 ? (
            <TrendingUp className="h-4 w-4 text-green-600" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-600" />
          )}
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${(stats?.totalPnL || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(stats?.totalPnL || 0)}
          </div>
          <p className="text-xs text-muted-foreground">
            {formatPercentage(stats?.totalPnLPercent || 0)}
          </p>
        </CardContent>
      </Card>

      {/* Today's P&L */}
      <Card className="overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500" />
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Today&apos;s P&L</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${(stats?.todayPnL || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(stats?.todayPnL || 0)}
          </div>
          <p className="text-xs text-muted-foreground">
            {formatPercentage(stats?.todayPnLPercent || 0)}
          </p>
        </CardContent>
      </Card>

      {/* Active Positions */}
      <Card className="overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-emerald-400 to-teal-500" />
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Positions</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.openPositions || 0}</div>
          <p className="text-xs text-muted-foreground">
            Open positions
          </p>
        </CardContent>
      </Card>
    </div>
  );
}