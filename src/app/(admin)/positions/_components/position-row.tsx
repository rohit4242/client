"use client";

import { useState, useMemo, memo } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { PositionWithRelations } from "@/features/position";
import { PositionAction } from "@/features/position";
import { PositionActions } from "./position-actions";
import { PositionDetailsPanel } from "./position-details-panel";
import { cn, formatDate } from "@/lib/utils";
import { useRealtimePrice } from "@/features/binance/client";
import { MarkPrice } from "@/components/ui/live-price";
import { useSelectedUser } from "@/contexts/selected-user-context";
import {
  getStatusBadge,
  getPnLColor,
  formatPercentage,
  formatCurrency
} from "../_utils/formatters";
import { Badge } from "@/components/ui/badge";

interface PositionRowProps {
  position: PositionWithRelations;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  onPositionAction?: (action: PositionAction) => Promise<void>;
  currentPrice?: number;
}

function PositionRowComponent({
  position,
  isExpanded = false,
  onToggleExpand,
  onPositionAction,
  currentPrice,
}: PositionRowProps) {
  const [actionLoading, setActionLoading] = useState(false);
  const { selectedUser } = useSelectedUser();

  // Use real-time price hook from features/binance
  const { price: livePrice, isLive } = useRealtimePrice(position.symbol, {
    exchangeId: position.exchange.id,
    enabled: position.status === "OPEN",
  });

  // Priority: passed currentPrice > live price > position.currentPrice > entryPrice as fallback
  const price = currentPrice || (livePrice ? parseFloat(livePrice) : null) || position.currentPrice || position.entryPrice;

  const isClosedPosition = position.status === "CLOSED";


  const handlePositionAction = async (action: PositionAction) => {
    if (!onPositionAction) return;

    setActionLoading(true);
    try {
      await onPositionAction(action);
    } catch (error) {
      console.error("Position action failed:", error);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <>
      {/* Main Position Row */}
      <TableRow className="hover:bg-muted/30">
        <TableCell>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={onToggleExpand}
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </TableCell>

        {/* Symbol */}
        <TableCell>
          <div className="flex flex-col">
            <span className="font-semibold text-slate-900">{position.symbol}</span>
            <span className="text-[10px] text-slate-500 font-medium">{position.exchange.name}</span>
          </div>
        </TableCell>

        {/* Side */}
        <TableCell>
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] font-bold h-5 px-2",
              position.side === "LONG"
                ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                : "text-red-700 bg-red-50 border-red-200"
            )}
          >
            {position.side}
          </Badge>
        </TableCell>

        {/* Entry Price */}
        <TableCell className="font-mono text-sm">
          ${position.entryPrice?.toFixed(4) || "0.0000"}
        </TableCell>

        {/* Current / Exit Price */}
        <TableCell className="font-mono text-sm">
          {isClosedPosition ? (
            <span className="text-slate-600">
              ${position.exitPrice?.toFixed(4) || "-"}
            </span>
          ) : (
            <MarkPrice
              symbol={position.symbol}
              fallbackPrice={position.currentPrice || position.entryPrice}
              userId={selectedUser?.id}
            />
          )}
        </TableCell>

        {/* Quantity */}
        <TableCell className="font-mono text-sm">
          {position.quantity}
        </TableCell>

        {/* P/L % */}
        <TableCell>
          <span className={cn("font-mono font-bold text-sm", getPnLColor(position.roiPercent))}>
            {formatPercentage(position.roiPercent)}
          </span>
        </TableCell>

        {/* P/L USD */}
        <TableCell>
          <span className={cn("font-mono text-sm", getPnLColor(position.pnlDisplay))}>
            {position.pnlDisplay >= 0 ? "+" : ""}
            {formatCurrency(position.pnlDisplay)}
          </span>
        </TableCell>

        {/* Status */}
        <TableCell>
          {getStatusBadge(position.status)}
        </TableCell>

        {/* Time (Entry or Closed) */}
        <TableCell className="text-xs text-slate-500 font-mono">
          {formatDate(new Date(isClosedPosition && position.closedAt ? position.closedAt : position.openedAt))}
        </TableCell>

        {/* Actions */}
        <TableCell className="text-right">
          <PositionActions
            position={position}
            onAction={handlePositionAction}
            disabled={actionLoading}
          />
        </TableCell>
      </TableRow>

      {/* Expanded Row Content */}
      {isExpanded && (
        <TableRow className="bg-slate-50/30">
          <TableCell colSpan={11} className="p-0">
            <PositionDetailsPanel position={position} currentPrice={price} />
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

// Export memoized version to prevent unnecessary re-renders
export const PositionRow = memo(PositionRowComponent);
