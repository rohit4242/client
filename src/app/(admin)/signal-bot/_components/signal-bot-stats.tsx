import { Bot, Activity, TrendingUp, DollarSign } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { BotStatsResult } from "@/features/signal-bot";
import { StatCard } from "./stat-card";

interface SignalBotStatsProps {
  stats?: BotStatsResult;
}

export function SignalBotStats({ stats }: SignalBotStatsProps) {
  const {
    totalBots = 0,
    activeBots = 0,
    totalTrades = 0,
    totalPnl = 0,
    winRate = 0
  } = stats || {};

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Bots"
        value={totalBots}
        icon={Bot}
        subValue={`${activeBots} active`}
      />

      <StatCard
        title="Total Trades"
        value={totalTrades}
        icon={Activity}
        subValue="All-time trades"
      />

      <StatCard
        title="Total P&L"
        value={formatCurrency(totalPnl)}
        icon={DollarSign}
        subValue="All-time profit/loss"
        trend={totalPnl > 0 ? "up" : totalPnl < 0 ? "down" : "neutral"}
      />

      <StatCard
        title="Performance"
        value={totalTrades > 0 ? `${winRate.toFixed(1)}%` : 'N/A'}
        icon={TrendingUp}
        subValue="Overall performance"
        trend={winRate > 50 ? "up" : winRate > 0 ? "neutral" : undefined}
      />
    </div>
  );
}
