"use client";

import { Spinner } from "@/components/spinner";

interface DashboardLoadingProps {
  message?: string;
}

export function DashboardLoading({ message = "Loading dashboard..." }: DashboardLoadingProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
      <Spinner className="w-8 h-8" />
      <p className="text-muted-foreground text-sm">{message}</p>
    </div>
  );
}