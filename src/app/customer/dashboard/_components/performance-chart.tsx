"use client";

import { PortfolioStats } from "@/db/actions/customer/get-portfolio-stats";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Percent, Award } from "lucide-react";

interface PerformanceChartProps {
  stats: PortfolioStats | null;
}

export function PerformanceChart({ stats }: PerformanceChartProps) {
  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading performance data...</p>
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(value);
  };

  const performanceMetrics = [
    {
      label: "Daily P&L",
      value: formatCurrency(stats.dailyPnl),
      icon: TrendingUp,
      color: stats.dailyPnl >= 0 ? "text-green-500" : "text-red-500",
      bgColor: stats.dailyPnl >= 0 ? "bg-green-500/10" : "bg-red-500/10",
    },
    {
      label: "Weekly P&L",
      value: formatCurrency(stats.weeklyPnl),
      icon: TrendingUp,
      color: stats.weeklyPnl >= 0 ? "text-green-500" : "text-red-500",
      bgColor: stats.weeklyPnl >= 0 ? "bg-green-500/10" : "bg-red-500/10",
    },
    {
      label: "Monthly P&L",
      value: formatCurrency(stats.monthlyPnl),
      icon: TrendingUp,
      color: stats.monthlyPnl >= 0 ? "text-green-500" : "text-red-500",
      bgColor: stats.monthlyPnl >= 0 ? "bg-green-500/10" : "bg-red-500/10",
    },
  ];

  const tradingMetrics = [
    {
      label: "Avg Win",
      value: formatCurrency(stats.avgWinAmount),
      icon: Award,
      color: "text-green-500",
    },
    {
      label: "Avg Loss",
      value: formatCurrency(stats.avgLossAmount),
      icon: Award,
      color: "text-red-500",
    },
    {
      label: "Largest Win",
      value: formatCurrency(stats.largestWin),
      icon: Award,
      color: "text-green-600",
    },
    {
      label: "Largest Loss",
      value: formatCurrency(stats.largestLoss),
      icon: Award,
      color: "text-red-600",
    },
    {
      label: "Profit Factor",
      value: stats.profitFactor.toFixed(2),
      icon: Percent,
      color: stats.profitFactor >= 1 ? "text-green-500" : "text-red-500",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Performance Overview</CardTitle>
        <CardDescription>
          Your trading performance metrics
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Time-based P&L */}
        <div>
          <h3 className="text-sm font-semibold mb-3">Time-based P&L</h3>
          <div className="grid grid-cols-3 gap-4">
            {performanceMetrics.map((metric, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg ${metric.bgColor}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <metric.icon className={`h-4 w-4 ${metric.color}`} />
                  <p className="text-sm font-medium text-muted-foreground">
                    {metric.label}
                  </p>
                </div>
                <p className={`text-xl font-bold ${metric.color}`}>
                  {metric.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Trading Metrics */}
        <div>
          <h3 className="text-sm font-semibold mb-3">Trading Metrics</h3>
          <div className="grid grid-cols-2 gap-4">
            {tradingMetrics.map((metric, index) => (
              <div
                key={index}
                className="p-3 rounded-lg border bg-card"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {metric.label}
                  </p>
                  <metric.icon className={`h-4 w-4 ${metric.color}`} />
                </div>
                <p className={`text-lg font-bold mt-1 ${metric.color}`}>
                  {metric.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Portfolio Info */}
        <div className="p-4 rounded-lg bg-muted/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Initial Balance</p>
              <p className="text-lg font-semibold">
                {formatCurrency(stats.initialBalance)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Current Balance</p>
              <p className="text-lg font-semibold">
                {formatCurrency(stats.currentBalance)}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

