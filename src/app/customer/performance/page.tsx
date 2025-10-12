import { getUserWithRole } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import { getPortfolioStats } from "@/db/actions/customer/get-portfolio-stats";
import { PerformanceOverview } from "./_components/performance-overview";
import { TradingStatistics } from "./_components/trading-statistics";

export default async function CustomerPerformancePage() {
  const user = await getUserWithRole();

  if (!user) {
    redirect("/sign-in");
  }

  const stats = await getPortfolioStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Performance Analytics</h1>
        <p className="text-muted-foreground">
          Comprehensive view of your trading performance and statistics.
        </p>
      </div>

      <PerformanceOverview stats={stats} />
      <TradingStatistics stats={stats} />
    </div>
  );
}

