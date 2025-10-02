"use client";

import {  CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartDataPoint } from "@/db/actions/customer/get-portfolio-chart-data";
import { TrendingUp, TrendingDown } from "lucide-react";

interface PortfolioPerformanceChartProps {
  data: ChartDataPoint[];
  initialBalance: number;
  currentBalance: number;
}

export function PortfolioPerformanceChart({ 
  data, 
  initialBalance,
  currentBalance 
}: PortfolioPerformanceChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Performance</CardTitle>
          <CardDescription>Portfolio value over the last 30 days • No data available</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex items-center justify-center text-muted-foreground">
            No chart data available. Start trading to see your portfolio performance.
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(date);
  };

  const formatCurrencyCompact = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  // Calculate total return and percentage
  const totalReturn = currentBalance - initialBalance;
  const returnPercentage = initialBalance > 0 
    ? ((totalReturn / initialBalance) * 100).toFixed(2)
    : "0.00";
  const isPositive = totalReturn >= 0;

  // Get min and max for Y-axis domain
  const values = data.map(d => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const padding = (maxValue - minValue) * 0.1; // 10% padding
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Portfolio Performance
              <span className={`flex items-center text-sm font-normal ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                {isPositive ? '+' : ''}{returnPercentage}%
              </span>
            </CardTitle>
            <CardDescription>
              Portfolio value over the last 30 days • {isPositive ? '+' : ''}{formatCurrency(totalReturn)} total return
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop 
                  offset="5%" 
                  stopColor={isPositive ? "hsl(142, 76%, 36%)" : "hsl(0, 84%, 60%)"} 
                  stopOpacity={0.3} 
                />
                <stop 
                  offset="95%" 
                  stopColor={isPositive ? "hsl(142, 76%, 36%)" : "hsl(0, 84%, 60%)"} 
                  stopOpacity={0} 
                />
              </linearGradient>
            </defs>
            <CartesianGrid 
              strokeDasharray="3 3" 
              className="stroke-muted" 
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              stroke="hsl(var(--muted-foreground))"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              dy={10}
            />
            <YAxis
              domain={[minValue - padding, maxValue + padding]}
              tickFormatter={formatCurrencyCompact}
              stroke="hsl(var(--muted-foreground))"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              dx={-10}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  const dayPnl = data.pnl;
                  const dayPnlPercent = initialBalance > 0 
                    ? ((dayPnl / initialBalance) * 100).toFixed(2)
                    : "0.00";
                  
                  return (
                    <div className="rounded-lg border bg-background p-3 shadow-lg">
                      <div className="grid gap-2">
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-xs text-muted-foreground">Date</span>
                          <span className="text-xs font-medium">{formatDate(data.date)}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-xs text-muted-foreground">Portfolio Value</span>
                          <span className="text-sm font-bold">{formatCurrency(data.value)}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-xs text-muted-foreground">P&L</span>
                          <span className={`text-sm font-bold ${dayPnl >= 0 ? "text-green-500" : "text-red-500"}`}>
                            {dayPnl >= 0 ? '+' : ''}{formatCurrency(dayPnl)} ({dayPnl >= 0 ? '+' : ''}{dayPnlPercent}%)
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={isPositive ? "hsl(142, 76%, 36%)" : "hsl(0, 84%, 60%)"}
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorValue)"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

