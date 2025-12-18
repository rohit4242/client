/**
 * Position Filters Component
 * 
 * Reusable filter controls for positions table.
 */

"use client";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { PositionFilters } from "@/features/position";


interface PositionFiltersProps {
    filters: PositionFilters;
    onFiltersChange: (filters: PositionFilters) => void;
    exchanges: string[];
    symbols: string[];
    statuses: string[];
}

export function PositionFiltersComponent({
    filters,
    onFiltersChange,
    exchanges,
    symbols,
    statuses,
}: PositionFiltersProps) {
    return (
        <div className="flex flex-wrap gap-2">
            <Select
                value={filters.exchange || "all"}
                onValueChange={(value) =>
                    onFiltersChange({
                        ...filters,
                        exchange: value === "all" ? undefined : value,
                    })
                }
            >
                <SelectTrigger className="w-[140px] h-9 text-sm">
                    <SelectValue placeholder="All exchanges" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All exchanges</SelectItem>
                    {exchanges.map((exchange) => (
                        <SelectItem key={exchange} value={exchange}>
                            {exchange}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Select
                value={filters.symbol || "all"}
                onValueChange={(value) =>
                    onFiltersChange({
                        ...filters,
                        symbol: value === "all" ? undefined : value,
                    })
                }
            >
                <SelectTrigger className="w-[120px] h-9 text-sm">
                    <SelectValue placeholder="All pairs" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All pairs</SelectItem>
                    {symbols.map((pair) => (
                        <SelectItem key={pair} value={pair}>
                            {pair}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Select
                value={filters.status || "all"}
                onValueChange={(value) =>
                    onFiltersChange({
                        ...filters,
                        status: value === "all" ? undefined : (value as any),
                    })
                }
            >
                <SelectTrigger className="w-[130px] h-9 text-sm">
                    <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    {statuses.map((status) => (
                        <SelectItem key={status} value={status}>
                            {status}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
