"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { generatePortfolioData, formatCurrency } from "@/lib/mock-data";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Tooltip } from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useMemo } from "react";

export function PortfolioChart() {
  const portfolioData = useMemo(() => generatePortfolioData(), []);
  
  // Calculate performance metrics
  const startValue = portfolioData[0]?.value || 0;
  const endValue = portfolioData[portfolioData.length - 1]?.value || 0;
  const totalReturn = endValue - startValue;
  const totalReturnPercent = startValue > 0 ? (totalReturn / startValue) * 100 : 0;
  const isPositive = totalReturn >= 0;

  // Calculate Y-axis domain for better chart display
  const values = portfolioData.map(d => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const padding = (maxValue - minValue) * 0.1; // 10% padding
  const yAxisMin = Math.max(0, minValue - padding);
  const yAxisMax = maxValue + padding;

  // Format data for the chart
  const chartData = portfolioData.map((point) => ({
    date: point.date,
    value: point.value,
    profit: point.profit,
    // Format date for display
    displayDate: new Date(point.date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    }),
  }));

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="flex-shrink-0">
        <CardTitle className="flex items-center justify-between">
          Portfolio Performance
          <div className={`flex items-center gap-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
            <span className="text-sm font-medium">
              {isPositive ? '+' : ''}{totalReturnPercent.toFixed(2)}%
            </span>
          </div>
        </CardTitle>
        <CardDescription>
          Portfolio value over the last 30 days • {isPositive ? '+' : ''}{formatCurrency(totalReturn)} total return
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <div className="h-full w-full px-6 pb-4" style={{ minHeight: '280px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart 
              data={chartData}
              margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
            >
              <defs>
                <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="hsl(var(--border))" 
                opacity={0.2} 
                horizontal={true}
                vertical={false}
              />
              <XAxis 
                dataKey="displayDate"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                interval="preserveStartEnd"
                height={20}
              />
              <YAxis 
                domain={[yAxisMin, yAxisMax]}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                width={50}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload || !payload.length) return null;
                  
                  return (
                    <div className="bg-background border border-border rounded-lg shadow-lg p-2 text-xs">
                      <p className="font-medium mb-1">{label}</p>
                      <p className="text-foreground">
                        Portfolio Value: {formatCurrency(payload[0]?.value as number || 0)}
                      </p>
                    </div>
                  );
                }}
                cursor={{ stroke: "#3b82f6", strokeWidth: 1, strokeDasharray: "5 5" }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#portfolioGradient)"
                dot={false}
                activeDot={{
                  r: 4,
                  fill: "#3b82f6",
                  strokeWidth: 2,
                  stroke: "#fff",
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
