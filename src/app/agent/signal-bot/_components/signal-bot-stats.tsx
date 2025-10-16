import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, Activity, TrendingUp, DollarSign } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface SignalBotStatsProps {
  totalBots: number;
  activeBots: number;
  totalTrades: number;
  totalPnl: number;
}

export function SignalBotStats({ totalBots, activeBots, totalTrades, totalPnl }: SignalBotStatsProps) {
  const winRate = totalTrades > 0 ? ((totalPnl > 0 ? 1 : 0) * 100) : 0; // Simplified calculation

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Bots</CardTitle>
          <Bot className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalBots}</div>
          <p className="text-xs text-muted-foreground">
            {activeBots} active
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Trades</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalTrades}</div>
          <p className="text-xs text-muted-foreground">
            All-time trades
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total P&L</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${totalPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(totalPnl)}
          </div>
          <p className="text-xs text-muted-foreground">
            All-time profit/loss
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Performance</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {totalTrades > 0 ? `${winRate.toFixed(1)}%` : 'N/A'}
          </div>
          <p className="text-xs text-muted-foreground">
            Overall performance
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
