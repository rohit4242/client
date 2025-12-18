"use client";

import { Button } from "@/components/ui/button";
import { RefreshCw, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";

interface DashboardHeaderProps {
  userName?: string;
  date: DateRange | undefined;
  setDate: (date: DateRange | undefined) => void;
}

export function DashboardHeader({ userName, date, setDate }: DashboardHeaderProps) {
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
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between pb-6 border-b border-slate-200">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">Dashboard</h1>
        <p className="text-slate-600 text-base">
          Welcome back, <span className="font-semibold text-teal-700">{userName}</span>
        </p>
      </div>
      <div className="flex items-center gap-3">
        <DatePickerWithRange date={date} setDate={setDate} />
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="h-10 border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 rounded-xl px-4 py-2 font-medium shadow-sm transition-all duration-200"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
        <Button asChild className="h-10 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white rounded-xl px-5 py-2 font-semibold shadow-md hover:shadow-lg transition-all duration-200">
          <Link href="/manual-trading">
            <Plus className="w-4 h-4 mr-2" />
            New Trade
          </Link>
        </Button>
      </div>
    </div>
  );
}
