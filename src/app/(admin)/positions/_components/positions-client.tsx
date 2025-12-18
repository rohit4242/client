/**
 * Positions Client Component
 * 
 * Main orchestration component for the positions page
 * Handles user selection, data fetching, and page layout
 */

"use client";

import { useSelectedUser } from "@/contexts/selected-user-context";
import { PositionsHeader } from "./positions-header";
import { PositionsTable } from "./positions-table";
import { PositionsLoadingSkeleton } from "./positions-loading";
import { PositionsEmptyState } from "./positions-empty-state";
import { PositionsErrorState } from "./positions-error-state";
import { NoUserSelected } from "../../_components/no-user-selected";
import { TrendingUp, RefreshCcw } from "lucide-react";
import { usePositionsQuery } from "@/features/position";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PositionsClient() {
    const { selectedUser } = useSelectedUser();

    // Use React Query for data fetching with auto-refresh capabilities
    const {
        data: queryResult,
        isLoading,
        error,
        refetch,
        isFetching
    } = usePositionsQuery(
        {
            userId: selectedUser?.id,
        },
        {
            staleTime: 5000,
            refetchInterval: false,
            enabled: !!selectedUser?.id,
        }
    );

    const positions = queryResult?.positions || [];

    // Show no user selected state
    if (!selectedUser) {
        return (
            <div className="flex flex-col h-full space-y-6">
                <div className="flex items-center justify-between pb-6 border-b border-slate-200">
                    <div className="flex items-center gap-4">
                        <div className="flex size-14 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-md">
                            <TrendingUp className="size-7" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                                Positions & Trading
                            </h1>
                            <p className="text-slate-600 text-base mt-1">
                                Monitor live positions, track P&L, and manage trading activity
                            </p>
                        </div>
                    </div>
                </div>
                <NoUserSelected />
            </div>
        );
    }

    return (
        <div className="flex flex-col space-y-6">
            {/* Header Section */}
            <div className="flex items-center justify-between pb-6 border-b border-slate-200">
                <div className="flex items-center gap-4">
                    <div className="flex size-14 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-md">
                        <TrendingUp className="size-7" />
                    </div>
                    <PositionsHeader
                        userName={selectedUser.name ?? undefined}
                        userEmail={selectedUser.email ?? undefined}
                    />
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => refetch()}
                        disabled={isFetching}
                        className="gap-2"
                    >
                        <RefreshCcw className={cn("size-4", isFetching && "animate-spin")} />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Main Content */}
            {isLoading ? (
                <PositionsLoadingSkeleton />
            ) : error ? (
                <PositionsErrorState error={error} onRetry={refetch} />
            ) : positions.length === 0 ? (
                <PositionsEmptyState />
            ) : (
                <PositionsTable
                    positions={positions}
                    isLoading={isLoading}
                    isRefreshing={isFetching}
                    onRefresh={refetch}
                />
            )}
        </div>
    );
}
