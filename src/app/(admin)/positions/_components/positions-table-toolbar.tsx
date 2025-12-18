/**
 * Positions Table Toolbar
 * 
 * Contains filters and action buttons
 */

"use client";

import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, XCircle } from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { PositionFiltersComponent } from "./position-filters";
import { PositionFilters } from "@/features/position";

interface PositionsTableToolbarProps {
    filters: PositionFilters;
    onFiltersChange: (filters: PositionFilters) => void;
    uniqueExchanges: string[];
    uniquePairs: string[];
    uniqueStatuses: string[];
    onRefresh?: () => void;
    isRefreshing?: boolean;
    onCloseAll?: () => void;
    isClosingAll?: boolean;
    onForceCloseAll?: () => void;
    isForceClosing?: boolean;
    positionsCount: number;
}

export function PositionsTableToolbar({
    filters,
    onFiltersChange,
    uniqueExchanges,
    uniquePairs,
    uniqueStatuses,
    onRefresh,
    isRefreshing,
    onCloseAll,
    isClosingAll,
    onForceCloseAll,
    isForceClosing,
    positionsCount,
}: PositionsTableToolbarProps) {
    return (
        <div className="flex flex-wrap gap-2">
            <PositionFiltersComponent
                filters={filters}
                onFiltersChange={onFiltersChange}
                exchanges={uniqueExchanges}
                symbols={uniquePairs}
                statuses={uniqueStatuses}
            />

            <Button
                variant="outline"
                size="sm"
                className="h-9 text-sm"
                onClick={onRefresh}
                disabled={isRefreshing}
            >
                {isRefreshing ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Refreshing...
                    </>
                ) : (
                    <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Refresh
                    </>
                )}
            </Button>

            <Button
                variant="outline"
                size="sm"
                className="h-9 text-sm text-red-600 hover:text-red-700"
                onClick={onCloseAll}
                disabled={isClosingAll}
            >
                {isClosingAll ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Closing...
                    </>
                ) : (
                    "Close All"
                )}
            </Button>

            {positionsCount > 0 && (
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" className="h-9 text-sm">
                            <XCircle className="h-4 w-4 mr-2" />
                            Force Close All (DB Only)
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Force Close All Positions?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will mark all open positions as CLOSED in the database only.
                                No actual trades will be executed on the exchange.

                                This action should only be used for:
                                - Testing/development
                                - Cleaning up stale positions
                                - Emergency database cleanup

                                {positionsCount} positions will be affected.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={onForceCloseAll}
                                className="bg-red-600 hover:bg-red-700"
                                disabled={isForceClosing}
                            >
                                {isForceClosing ? "Closing..." : "Force Close All"}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
        </div>
    );
}
