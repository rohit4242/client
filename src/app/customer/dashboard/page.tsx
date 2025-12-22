import { getUserWithRole } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import { getPortfolioStats } from "@/db/actions/customer/get-portfolio-stats";
import { getRecentPositions } from "@/db/actions/customer/get-recent-positions";
import { getSignals } from "@/features/signals";
import { getPortfolioChartData } from "@/db/actions/customer/get-portfolio-chart-data";
import { StatsCards } from "./_components/stats-cards";
import { RecentPositions } from "./_components/recent-positions";
import { RecentSignals } from "./_components/recent-signals";
import { PerformanceChart } from "./_components/performance-chart";
import { PortfolioPerformanceChart } from "./_components/portfolio-performance-chart";
import { DashboardHeader } from "./_components/dashboard-header";
import { getExchanges } from "@/features/exchange/actions/get-exchanges";
import { AccountBalances } from "@/components/trading/account-balances";

export default async function CustomerDashboardPage() {
  const user = await getUserWithRole();

  if (!user) {
    redirect("/sign-in");
  }

  // Fetch customer data
  const [stats, recentPositions, { signals: recentSignals }, chartData] = await Promise.all([
    getPortfolioStats(),
    getRecentPositions(5),
    getSignals({ limit: 5, visibleOnly: true }),
    getPortfolioChartData("1M"), // Last 30 days
  ]);

  const exchangesResult = await getExchanges();
  const exchange = exchangesResult.exchanges[0] || null;

  return (
    <div className="space-y-6">
      <DashboardHeader userName={user.name} stats={stats} />

      {/* Stats Cards */}
      <StatsCards stats={stats} />

      {/* Account Balances */}
      <AccountBalances exchange={exchange} />

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Chart and Metrics */}
        <div className="lg:col-span-2 space-y-6">
          <PortfolioPerformanceChart
            data={chartData}
            initialBalance={stats?.initialBalance || 0}
            currentBalance={stats?.currentBalance || 0}
          />
          <PerformanceChart stats={stats} />
        </div>

        {/* Right Column - Signals */}
        <div>
          <RecentSignals signals={recentSignals} />
        </div>
      </div>

      {/* Recent Positions - Full Width */}
      <RecentPositions positions={recentPositions} />
    </div>
  );
}

