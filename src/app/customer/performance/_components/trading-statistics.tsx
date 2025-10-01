import { PortfolioStats } from "@/db/actions/customer/get-portfolio-stats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Calendar, Award } from "lucide-react";

interface TradingStatisticsProps {
  stats: PortfolioStats | null;
}

export function TradingStatistics({ stats }: TradingStatisticsProps) {
  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Trading Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading statistics...</p>
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

  const timeBasedPnL = [
    {
      label: "Daily P&L",
      value: formatCurrency(stats.dailyPnl),
      color: stats.dailyPnl >= 0 ? "text-green-500" : "text-red-500",
      bgColor: stats.dailyPnl >= 0 ? "bg-green-500/10" : "bg-red-500/10",
    },
    {
      label: "Weekly P&L",
      value: formatCurrency(stats.weeklyPnl),
      color: stats.weeklyPnl >= 0 ? "text-green-500" : "text-red-500",
      bgColor: stats.weeklyPnl >= 0 ? "bg-green-500/10" : "bg-red-500/10",
    },
    {
      label: "Monthly P&L",
      value: formatCurrency(stats.monthlyPnl),
      color: stats.monthlyPnl >= 0 ? "text-green-500" : "text-red-500",
      bgColor: stats.monthlyPnl >= 0 ? "bg-green-500/10" : "bg-red-500/10",
    },
  ];

  const tradingMetrics = [
    {
      label: "Average Win",
      value: formatCurrency(stats.avgWinAmount),
      icon: TrendingUp,
      color: "text-green-500",
    },
    {
      label: "Average Loss",
      value: formatCurrency(stats.avgLossAmount),
      icon: TrendingUp,
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
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Time-based Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {timeBasedPnL.map((metric, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg ${metric.bgColor}`}
            >
              <p className="text-sm text-muted-foreground mb-1">
                {metric.label}
              </p>
              <p className={`text-2xl font-bold ${metric.color}`}>
                {metric.value}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Trade Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {tradingMetrics.map((metric, index) => (
            <div
              key={index}
              className="p-4 rounded-lg border bg-card"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {metric.label}
                </p>
                <metric.icon className={`h-4 w-4 ${metric.color}`} />
              </div>
              <p className={`text-xl font-bold mt-1 ${metric.color}`}>
                {metric.value}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Portfolio Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg border bg-card">
              <p className="text-sm text-muted-foreground mb-1">
                Initial Balance
              </p>
              <p className="text-lg font-semibold">
                {formatCurrency(stats.initialBalance)}
              </p>
            </div>
            <div className="p-4 rounded-lg border bg-card">
              <p className="text-sm text-muted-foreground mb-1">
                Current Balance
              </p>
              <p className="text-lg font-semibold">
                {formatCurrency(stats.currentBalance)}
              </p>
            </div>
            <div className="p-4 rounded-lg border bg-card">
              <p className="text-sm text-muted-foreground mb-1">
                Total Wins
              </p>
              <p className="text-lg font-semibold text-green-500">
                {stats.totalWins}
              </p>
            </div>
            <div className="p-4 rounded-lg border bg-card">
              <p className="text-sm text-muted-foreground mb-1">
                Total Losses
              </p>
              <p className="text-lg font-semibold text-red-500">
                {stats.totalLosses}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

