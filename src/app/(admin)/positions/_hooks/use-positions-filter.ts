/**
 * usePositionsFilter Hook
 * 
 * Extracts filtering logic for positions to improve component maintainability.
 */

import { useMemo } from "react";
import type { PositionWithRelations } from "@/features/position";
import type { PositionFilters } from "@/features/position";

export function usePositionsFilter(positions: PositionWithRelations[], filters: PositionFilters) {
    // Memoize filtered positions
    const filteredPositions = useMemo(() => {
        return positions.filter((position) => {
            if (filters.exchange && position.exchange.name !== filters.exchange)
                return false;
            if (filters.symbol && position.symbol !== filters.symbol) return false;
            if (filters.status && position.status !== filters.status) return false;

            // Side filter handles UI display vs DB enum
            if (filters.side) {
                const sideFilter = filters.side === "Long" ? "LONG" : "SHORT";
                if (position.side !== sideFilter) return false;
            }
            return true;
        });
    }, [positions, filters]);

    // Memoize unique values for filter dropdowns
    const uniqueExchanges = useMemo(
        () => [...new Set(positions.map((p) => p.exchange.name))].sort(),
        [positions]
    );
    const uniquePairs = useMemo(
        () => [...new Set(positions.map((p) => p.symbol))].sort(),
        [positions]
    );
    const uniqueStatuses = useMemo(
        () => [...new Set(positions.map((p) => p.status))].sort(),
        [positions]
    );

    return {
        filteredPositions,
        uniqueExchanges,
        uniquePairs,
        uniqueStatuses,
    };
}
