import { PortfolioStats } from "@/db/actions/customer/get-portfolio-stats";
import { TrendingUp, TrendingDown, Activity, Target, DollarSign } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatsCardsProps {
  stats: PortfolioStats | null;
}

export function StatsCards({ stats }: StatsCardsProps) {
  if (!stats) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <p className="text-sm font-medium text-muted-foreground">Loading...</p>
              <p className="text-2xl font-bold">--</p>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
  };

  const cards = [
    {
      title: "Portfolio Value",
      value: formatCurrency(stats.currentBalance),
      icon: DollarSign,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Total P&L",
      value: formatCurrency(stats.totalPnl),
      subtitle: formatPercent(stats.totalPnlPercent),
      icon: stats.totalPnl >= 0 ? TrendingUp : TrendingDown,
      color: stats.totalPnl >= 0 ? "text-green-500" : "text-red-500",
      bgColor: stats.totalPnl >= 0 ? "bg-green-500/10" : "bg-red-500/10",
    },
    {
      title: "Win Rate",
      value: `${stats.winRate.toFixed(1)}%`,
      subtitle: `${stats.totalWins}W / ${stats.totalLosses}L`,
      icon: Target,
      color: stats.winRate >= 50 ? "text-green-500" : "text-orange-500",
      bgColor: stats.winRate >= 50 ? "bg-green-500/10" : "bg-orange-500/10",
    },
    {
      title: "Active Positions",
      value: stats.activeTrades.toString(),
      subtitle: `${stats.totalTrades} total trades`,
      icon: Activity,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => (
        <Card key={index}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-x-4">
              <div className="space-y-1 flex-1">
                <p className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </p>
                <p className={`text-2xl font-bold ${card.color}`}>
                  {card.value}
                </p>
                {card.subtitle && (
                  <p className="text-xs text-muted-foreground">
                    {card.subtitle}
                  </p>
                )}
              </div>
              <div className={`p-3 rounded-lg ${card.bgColor}`}>
                <card.icon className={`h-6 w-6 ${card.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

