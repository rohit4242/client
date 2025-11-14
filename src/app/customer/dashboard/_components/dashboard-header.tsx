"use client";

import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PortfolioStats } from "@/db/actions/customer/get-portfolio-stats";

interface DashboardHeaderProps {
  userName?: string;
  stats: PortfolioStats | null;
}

export function DashboardHeader({ userName, stats }: DashboardHeaderProps) {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    window.location.reload();
    setRefreshing(false);
  };

  const handleSyncBalance = async () => {
    setRefreshing(true);
    try {
      const response = await fetch("/api/customer/sync-balance", {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success("Portfolio balance synced successfully");
        window.location.reload();
      } else {
        toast.info(data.message || "Balance already synced or no exchange found");
      }
    } catch (error) {
      console.error("Error syncing balance:", error);
      toast.error("Failed to sync balance");
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between pb-6 border-b border-slate-200">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">Dashboard</h1>
        <p className="text-slate-600 text-base">
          Welcome back, <span className="font-semibold text-teal-700">{userName}</span>
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 rounded-xl px-4 py-2 font-medium shadow-sm transition-all duration-200"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
        {stats && stats.initialBalance === 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleSyncBalance}
            disabled={refreshing}
            className="border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100 hover:border-teal-300 rounded-xl px-4 py-2 font-medium shadow-sm transition-all duration-200"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Sync Balance
          </Button>
        )}
      </div>
    </div>
  );
}

