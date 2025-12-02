"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { AdvancedPositionsTable } from "@/app/(admin)/positions/_components/advanced-positions-table";
import { usePositionsQuery } from "@/hooks/queries/use-positions-query";
import { useSelectedUser } from "@/contexts/selected-user-context";
import { Skeleton } from "@/components/ui/skeleton";

function PositionsLoading() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
      <div className="rounded-md border">
        <div className="p-4 space-y-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="flex items-center gap-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function PositionsPage() {
  const { selectedUser } = useSelectedUser();

  const { data: positions, isLoading, error } = usePositionsQuery({
    userId: selectedUser?.id,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Positions & Trading</h1>
        <p className="text-muted-foreground">
          Monitor your live positions, bot trades, and manual order history
        </p>
      </div>

      {isLoading ? (
        <PositionsLoading />
      ) : error ? (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to load positions. Please try again.
          </AlertDescription>
        </Alert>
      ) : positions && positions.length === 0 ? (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            No positions found. Create some positions by placing orders to see them here.
          </AlertDescription>
        </Alert>
      ) : (
        <AdvancedPositionsTable positions={positions} />
      )}
    </div>
  );
}
