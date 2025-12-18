/**
 * PositionDataTable
 * 
 * A unified table component for displaying positions.
 * Handles both Live and History views by dynamically adjusting columns.
 */

import {
    Table,
    TableBody,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import type { PositionWithRelations } from "@/features/position";
import type { PositionAction } from "@/features/position";
import { PositionRow } from "./position-row";

interface PositionDataTableProps {
    positions: PositionWithRelations[];
    mode: "live" | "history";
    expandedRows: Set<string>;
    onToggleExpand: (id: string) => void;
    onPositionAction: (action: PositionAction) => Promise<void>;
    livePrices?: Record<string, number>;
}

export function PositionDataTable({
    positions,
    mode,
    expandedRows,
    onToggleExpand,
    onPositionAction,
    livePrices = {},
}: PositionDataTableProps) {
    const isLive = mode === "live";

    return (
        <div className="rounded-md border overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow className="bg-slate-50/50">
                        <TableHead className="w-[50px]"></TableHead>
                        <TableHead>Symbol</TableHead>
                        <TableHead>Side</TableHead>
                        <TableHead>Entry Price</TableHead>
                        <TableHead>{isLive ? "Current Price" : "Exit Price"}</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>P/L %</TableHead>
                        <TableHead>P/L USD</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>{isLive ? "Entry Time" : "Closed At"}</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {positions.map((position) => (
                        <PositionRow
                            key={position.id}
                            position={position}
                            isExpanded={expandedRows.has(position.id)}
                            onToggleExpand={() => onToggleExpand(position.id)}
                            onPositionAction={onPositionAction}
                            currentPrice={isLive ? livePrices[position.symbol] : undefined}
                        />
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
