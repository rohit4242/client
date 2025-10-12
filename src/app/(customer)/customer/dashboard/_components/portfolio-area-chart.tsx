"use client";

import { useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChartDataPoint } from "@/db/actions/customer/get-portfolio-chart-data";
import { TrendingUp } from "lucide-react";

interface PortfolioAreaChartProps {
  data: ChartDataPoint[];
}

export function PortfolioAreaChart({ data }: PortfolioAreaChartProps) {
  const [period, setPeriod] = useState<"1M" | "3M" | "6M" | "1Y">("3M");

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Area Chart
          </CardTitle>
          <CardDescription>Showing total visitors for the last 3 months</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No chart data available
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

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Area Chart - Interactive
          </CardTitle>
          <CardDescription>
            Showing portfolio value for the last {period === "1M" ? "month" : period === "3M" ? "3 months" : period === "6M" ? "6 months" : "year"}
          </CardDescription>
        </div>
        <Select value={period} onValueChange={(value: "1M" | "3M" | "6M" | "1Y") => setPeriod(value)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1M">Last month</SelectItem>
            <SelectItem value="3M">Last 3 months</SelectItem>
            <SelectItem value="6M">Last 6 months</SelectItem>
            <SelectItem value="1Y">Last year</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tickFormatter={(value) => `$${value.toLocaleString()}`}
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="rounded-lg border bg-background p-3 shadow-lg">
                      <div className="grid gap-2">
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-sm text-muted-foreground">Date:</span>
                          <span className="text-sm font-medium">{formatDate(data.date)}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-sm text-muted-foreground">Portfolio Value:</span>
                          <span className="text-sm font-bold">{formatCurrency(data.value)}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-sm text-muted-foreground">P&L:</span>
                          <span className={`text-sm font-bold ${data.pnl >= 0 ? "text-green-500" : "text-red-500"}`}>
                            {formatCurrency(data.pnl)}
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
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorValue)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

