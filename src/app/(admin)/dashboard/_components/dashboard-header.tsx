"use client";

import { Button } from "@/components/ui/button";
import { RefreshCw, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface DashboardHeaderProps {
  userName?: string;
}

export function DashboardHeader({ userName }: DashboardHeaderProps) {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Add your refresh logic here
    // For example: await refetchData();
    // Simulate refresh delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {userName}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
        <Button asChild>
          <Link href="/manual-trading">
            <Plus className="w-4 h-4 mr-2" />
            New Trade
          </Link>
        </Button>
      </div>
    </div>
  );
}