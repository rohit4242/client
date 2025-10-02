import { getUserWithRole } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import { getPortfolioStats } from "@/db/actions/customer/get-portfolio-stats";
import { getRecentPositions } from "@/db/actions/customer/get-recent-positions";
import { getRecentSignals } from "@/db/actions/customer/get-recent-signals";
import { getPortfolioChartData } from "@/db/actions/customer/get-portfolio-chart-data";
import { StatsCards } from "./_components/stats-cards";
import { RecentPositions } from "./_components/recent-positions";
import { RecentSignals } from "./_components/recent-signals";
import { PerformanceChart } from "./_components/performance-chart";
import { PortfolioPerformanceChart } from "./_components/portfolio-performance-chart";
import { SyncBalanceButton } from "./_components/sync-balance-button";

export default async function CustomerDashboardPage() {
  const user = await getUserWithRole();

  if (!user) {
    redirect("/sign-in");
  }

  // Fetch customer data
  const [stats, recentPositions, recentSignals, chartData] = await Promise.all([
    getPortfolioStats(),
    getRecentPositions(5),
    getRecentSignals(5),
    getPortfolioChartData("1M"), // Last 30 days
  ]);

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back, {user.name}!
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Here&apos;s your portfolio overview and recent activity
          </p>
        </div>
        {stats && stats.initialBalance === 0 && (
          <SyncBalanceButton />
        )}
      </div>

      {/* Stats Cards */}
      <StatsCards stats={stats} />

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

