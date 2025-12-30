/**
 * Positions Client Component
 * 
 * Main orchestration component for the positions page
 * Handles user selection, data fetching, pagination, and page layout
 */

"use client";

import { useState } from "react";
import { useSelectedUser } from "@/contexts/selected-user-context";
import { PositionsHeader } from "./positions-header";
import { PositionsTable } from "./positions-table";
import { PositionsLoadingSkeleton } from "./positions-loading";
import { PositionsEmptyState } from "./positions-empty-state";
import { PositionsErrorState } from "./positions-error-state";
import { NoUserSelected } from "../../_components/no-user-selected";
import { TrendingUp, RefreshCcw, History, LayoutGrid } from "lucide-react";
import { usePositionsQuery } from "@/features/position";
import { Button } from "@/components/ui/button";
import { PositionStatus } from "@prisma/client";
import { cn } from "@/lib/utils";

export function PositionsClient() {
    const { selectedUser } = useSelectedUser();

    // Tab state
    const [activeTab, setActiveTab] = useState<"live" | "history">("live");

    // Pagination state
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);

    // Filter statuses based on tab
    const statuses = activeTab === "live"
        ? [PositionStatus.OPEN, PositionStatus.PENDING]
        : [PositionStatus.CLOSED, PositionStatus.CANCELED, PositionStatus.FAILED];

    // Use React Query for data fetching with auto-refresh and pagination
    const {
        data: queryResult,
        isLoading,
        error,
        refetch,
        isFetching
    } = usePositionsQuery(
        {
            userId: selectedUser?.id,
            status: statuses,
            page,
            pageSize,
        },
        {
            staleTime: 5000,
            refetchInterval: 5000, // Refresh every 5 seconds for live data
            enabled: !!selectedUser?.id,
        }
    );

    const handleTabChange = (tab: string) => {
        setActiveTab(tab as "live" | "history");
        setPage(1); // Reset to first page when switching tabs
    };

    const positions = queryResult?.positions || [];
    const paginationMeta = {
        page: queryResult?.page ?? 1,
        pageSize: queryResult?.pageSize ?? 20,
        totalPages: queryResult?.totalPages ?? 1,
        total: queryResult?.total ?? 0,
        hasNextPage: queryResult?.hasNextPage ?? false,
        hasPreviousPage: queryResult?.hasPreviousPage ?? false,
    };

    const handlePageChange = (newPage: number) => {
        setPage(newPage);
    };

    const handlePageSizeChange = (newSize: number) => {
        setPageSize(newSize);
        setPage(1); // Reset to first page when changing page size
    };

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
            ) : positions.length === 0 && page === 1 ? (
                <PositionsEmptyState />
            ) : (
                <PositionsTable
                    positions={positions}
                    pagination={paginationMeta}
                    onPageChange={handlePageChange}
                    onPageSizeChange={handlePageSizeChange}
                    isLoading={isLoading}
                    isRefreshing={isFetching}
                    onRefresh={refetch}
                    activeTab={activeTab}
                    onTabChange={handleTabChange}
                />
            )}
        </div>
    );
}
