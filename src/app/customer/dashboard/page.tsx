import { getUserWithRole } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import { getPortfolioStats } from "@/db/actions/customer/get-portfolio-stats";
import { getRecentPositions } from "@/db/actions/customer/get-recent-positions";
import { getRecentSignals } from "@/db/actions/customer/get-recent-signals";
import { StatsCards } from "./_components/stats-cards";
import { RecentPositions } from "./_components/recent-positions";
import { RecentSignals } from "./_components/recent-signals";
import { PerformanceChart } from "./_components/performance-chart";

export default async function CustomerDashboardPage() {
  const user = await getUserWithRole();

  if (!user) {
    redirect("/sign-in");
  }

  // Fetch customer data
  const [stats, recentPositions, recentSignals] = await Promise.all([
    getPortfolioStats(),
    getRecentPositions(5),
    getRecentSignals(5),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {user.name}!
          </h1>
          <p className="text-muted-foreground">
            Here&apos;s your portfolio overview and recent activity.
          </p>
        </div>
      </div>

      <StatsCards stats={stats} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PerformanceChart stats={stats} />
        </div>
        <div className="space-y-6">
          <RecentSignals signals={recentSignals} />
        </div>
      </div>

      <RecentPositions positions={recentPositions} />
    </div>
  );
}

