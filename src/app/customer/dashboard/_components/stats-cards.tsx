import { PortfolioStats } from "@/db/actions/customer/get-portfolio-stats";
import { TrendingUp, TrendingDown, Activity, Target, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StatsCardsProps {
  stats: PortfolioStats | null;
}

export function StatsCards({ stats }: StatsCardsProps) {
  if (!stats) {
    return (
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="overflow-hidden border-slate-200 shadow-md hover:shadow-lg transition-all duration-200 rounded-xl">
            <div className="h-1.5 w-full bg-gradient-to-r from-slate-300 to-slate-400" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-5">
              <CardTitle className="text-sm font-bold text-slate-900">Loading...</CardTitle>
              <div className="p-2 bg-slate-50 rounded-lg">
                <Wallet className="h-5 w-5 text-slate-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">--</div>
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
            {formatCurrency(stats.currentBalance)}
          </div>
          <p className="text-sm text-slate-600 mt-1 font-medium">
            Current balance
          </p>
        </CardContent>
      </Card>

      {/* Total P&L */}
      <Card className="overflow-hidden border-slate-200 shadow-md hover:shadow-lg transition-all duration-200 rounded-xl">
        <div className={`h-1.5 w-full ${stats.totalPnl >= 0 ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gradient-to-r from-red-400 to-rose-500'}`} />
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-5">
          <CardTitle className="text-sm font-bold text-slate-900">Total P&L</CardTitle>
          <div className={`p-2 rounded-lg ${stats.totalPnl >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
            {stats.totalPnl >= 0 ? (
              <TrendingUp className="h-5 w-5 text-green-600" />
            ) : (
              <TrendingDown className="h-5 w-5 text-red-600" />
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className={`text-3xl font-bold ${stats.totalPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(stats.totalPnl)}
          </div>
          <p className="text-sm text-slate-600 mt-1 font-medium">
            {formatPercent(stats.totalPnlPercent)}
          </p>
        </CardContent>
      </Card>

      {/* Win Rate */}
      <Card className="overflow-hidden border-slate-200 shadow-md hover:shadow-lg transition-all duration-200 rounded-xl">
        <div className={`h-1.5 w-full ${stats.winRate >= 50 ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gradient-to-r from-orange-400 to-amber-500'}`} />
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-5">
          <CardTitle className="text-sm font-bold text-slate-900">Win Rate</CardTitle>
          <div className={`p-2 rounded-lg ${stats.winRate >= 50 ? 'bg-green-50' : 'bg-orange-50'}`}>
            <Target className={`h-5 w-5 ${stats.winRate >= 50 ? 'text-green-600' : 'text-orange-600'}`} />
          </div>
        </CardHeader>
        <CardContent>
          <div className={`text-3xl font-bold ${stats.winRate >= 50 ? 'text-green-600' : 'text-orange-600'}`}>
            {stats.winRate.toFixed(1)}%
          </div>
          <p className="text-sm text-slate-600 mt-1 font-medium">
            {stats.totalWins}W / {stats.totalLosses}L
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
          <div className="text-3xl font-bold text-slate-900">{stats.activeTrades}</div>
          <p className="text-sm text-slate-600 mt-1 font-medium">
            {stats.totalTrades} total trades
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

