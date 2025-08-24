
import { DashboardHeader } from "./_components/dashboard-header";
import { StatsCards } from "./_components/stats-cards";
import { QuickActions } from "./_components/quick-actions";
import { QuickNav } from "../_components/quick-nav";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function DashboardPage() {
  
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  return (
    <div className="space-y-6">
      <DashboardHeader
        userName={session.user.name}
      />

      <QuickNav />

      <StatsCards
        stats={{
          totalPortfolioValue: 0,
          totalPnL: 0,
          totalPnLPercent: 0,
          openPositions: 0,
        }}
      />

      <QuickActions />
    </div>
  );
}
