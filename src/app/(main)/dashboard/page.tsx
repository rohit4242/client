
import { DashboardHeader } from "./_components/dashboard-header";
import { StatsCards } from "./_components/stats-cards";
import { QuickActions } from "./_components/quick-actions";
import { PortfolioChart } from "./_components/portfolio-chart";
import { RecentOrders } from "./_components/recent-orders";
import { SignalBotWidget } from "./_components/signal-bot-widget";
import { QuickNav } from "../_components/quick-nav";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { generateDashboardStats } from "@/lib/mock-data";

export default async function DashboardPage() {
  
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  // Generate mock dashboard statistics
  const stats = generateDashboardStats();

  return (
    <div className="space-y-6">
      <DashboardHeader
        userName={session.user.name}
      />

      <QuickNav />

      <StatsCards stats={stats} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <PortfolioChart />
        </div>
        <div className="space-y-6">
          <SignalBotWidget />
          <RecentOrders />
        </div>
      </div>

      <QuickActions />
    </div>
  );
}
