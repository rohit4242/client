/**
 * Positions Table
 * 
 * Main table component for displaying positions with pagination
 * Optimized client component with React Query integration and real-time updates
 * 
 * Performance optimizations:
 * - Memoized filtering and unique value extraction
 * - Position rows use React.memo to prevent unnecessary re-renders
 * - Efficient live price updates via WebSocket
 * - Pagination for large datasets
 */

"use client";

import { useState, useMemo, useCallback, useEffect } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { PositionWithRelations } from "@/features/position";
import { PositionAction, PositionFilters } from "@/features/position";
import { PositionsTableToolbar } from "./positions-table-toolbar";
import { PositionsFilteredEmpty } from "./positions-filtered-empty";
import { PaginationControls } from "./pagination-controls";
import { useLivePrices } from "@/hooks/trading/use-live-price";
import { useClosePositionMutation, useForceCloseAllMutation } from "@/features/position";
import { useCloseAllPositionsMutation } from "@/features/trading/hooks";
import { useSelectedUser } from "@/contexts/selected-user-context";
import { usePositionsFilter } from "../_hooks/use-positions-filter";
import { PositionDataTable } from "./position-data-table";

interface PositionsTableProps {
    positions: PositionWithRelations[];
    pagination: {
        page: number;
        pageSize: number;
        totalPages: number;
        total: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
    };
    onPageChange: (page: number) => void;
    onPageSizeChange: (pageSize: number) => void;
    isLoading?: boolean;
    isRefreshing?: boolean;
    onRefresh?: () => void;
    activeTab: "live" | "history";
    onTabChange: (tab: string) => void;
}

export function PositionsTable({
    positions,
    pagination,
    onPageChange,
    onPageSizeChange,
    isLoading,
    isRefreshing,
    onRefresh,
    activeTab,
    onTabChange,
}: PositionsTableProps) {
    const [filters, setFilters] = useState<PositionFilters>({});
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    const [mounted, setMounted] = useState(false);

    // Mutation hooks
    const closeMutation = useClosePositionMutation();
    const closeAllMutation = useCloseAllPositionsMutation();
    const forceCloseAllMutation = useForceCloseAllMutation();
    const { selectedUser } = useSelectedUser();

    // Use centralized filtering logic
    const {
        filteredPositions,
        uniqueExchanges,
        uniquePairs,
        uniqueStatuses
    } = usePositionsFilter(positions, filters);

    // Set mounted on client
    useEffect(() => {
        setMounted(true);
    }, []);

    // Unique symbols for live price fetching
    const symbols = useMemo(
        () => [...new Set(positions.map((p) => p.symbol))],
        [positions]
    );
    const { prices: livePrices } = useLivePrices(symbols, selectedUser?.id);

    // Row expansion logic
    const toggleRowExpansion = useCallback((positionId: string) => {
        setExpandedRows(prev => {
            const newExpanded = new Set(prev);
            if (newExpanded.has(positionId)) {
                newExpanded.delete(positionId);
            } else {
                newExpanded.add(positionId);
            }
            return newExpanded;
        });
    }, []);

    const handlePositionAction = useCallback(async (action: PositionAction) => {
        if (action.type === "CLOSE_POSITION") {
            closeMutation.mutate({ positionId: action.payload.positionId });
        }
    }, [closeMutation]);

    const handleCloseAllPositions = useCallback(() => {
        closeAllMutation.mutate();
    }, [closeAllMutation]);

    const handleForceCloseAll = useCallback(() => {
        forceCloseAllMutation.mutate({});
    }, [forceCloseAllMutation]);

    const handleClearFilters = useCallback(() => {
        setFilters({});
    }, []);

    const hasActiveFilters = Object.keys(filters).length > 0;

    if (!mounted) return null;

    return (
        <div className="space-y-4">
            <Tabs value={activeTab} onValueChange={onTabChange}>
                <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                    <TabsList className="grid w-full lg:w-auto grid-cols-2">
                        <TabsTrigger value="live" className="text-sm">Live</TabsTrigger>
                        <TabsTrigger value="history" className="text-sm">History</TabsTrigger>
                    </TabsList>

                    <PositionsTableToolbar
                        filters={filters}
                        onFiltersChange={setFilters}
                        uniqueExchanges={uniqueExchanges}
                        uniquePairs={uniquePairs}
                        uniqueStatuses={uniqueStatuses}
                        onRefresh={onRefresh}
                        isRefreshing={isRefreshing}
                        onCloseAll={handleCloseAllPositions}
                        isClosingAll={closeAllMutation.isPending}
                        onForceCloseAll={handleForceCloseAll}
                        isForceClosing={forceCloseAllMutation.isPending}
                        positionsCount={filteredPositions.length}
                        activeTab={activeTab}
                    />
                </div>

                <TabsContent value="live" className="mt-6">
                    {filteredPositions.length === 0 ? (
                        <PositionsFilteredEmpty onClearFilters={hasActiveFilters ? handleClearFilters : undefined} />
                    ) : (
                        <>
                            <Card>
                                <CardContent className="p-0">
                                    <PositionDataTable
                                        mode="live"
                                        positions={filteredPositions}
                                        expandedRows={expandedRows}
                                        onToggleExpand={toggleRowExpansion}
                                        onPositionAction={handlePositionAction}
                                        livePrices={livePrices}
                                    />
                                </CardContent>
                            </Card>
                            <PaginationControls
                                page={pagination.page}
                                pageSize={pagination.pageSize}
                                totalPages={pagination.totalPages}
                                total={pagination.total}
                                hasNextPage={pagination.hasNextPage}
                                hasPreviousPage={pagination.hasPreviousPage}
                                onPageChange={onPageChange}
                                onPageSizeChange={onPageSizeChange}
                            />
                        </>
                    )}
                </TabsContent>

                <TabsContent value="history" className="mt-6">
                    {filteredPositions.length === 0 ? (
                        <PositionsFilteredEmpty onClearFilters={hasActiveFilters ? handleClearFilters : undefined} />
                    ) : (
                        <>
                            <Card>
                                <CardContent className="p-0">
                                    <PositionDataTable
                                        mode="history"
                                        positions={filteredPositions}
                                        expandedRows={expandedRows}
                                        onToggleExpand={toggleRowExpansion}
                                        onPositionAction={handlePositionAction}
                                    />
                                </CardContent>
                            </Card>
                            <PaginationControls
                                page={pagination.page}
                                pageSize={pagination.pageSize}
                                totalPages={pagination.totalPages}
                                total={pagination.total}
                                hasNextPage={pagination.hasNextPage}
                                hasPreviousPage={pagination.hasPreviousPage}
                                onPageChange={onPageChange}
                                onPageSizeChange={onPageSizeChange}
                            />
                        </>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
