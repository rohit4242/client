"use client";

import { useState } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Copy } from "lucide-react";
import { toast } from "sonner";
import { PositionData, PositionAction } from "@/types/position";
import { PositionActions } from "./position-actions";
import { OrderHistory } from "./order-history";
import { cn, formatDate } from "@/lib/utils";
import { useLivePrice } from "@/hooks/trading/use-live-price";
import { MarkPrice } from "@/components/ui/live-price";
import { useSelectedUser } from "@/contexts/selected-user-context";

interface PositionRowProps {
  position: PositionData;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  onPositionAction?: (action: PositionAction) => Promise<void>;
  currentPrice?: number;
}

export function PositionRow({
  position,
  isExpanded = false,
  onToggleExpand,
  onPositionAction,
  currentPrice,
}: PositionRowProps) {
  const [actionLoading, setActionLoading] = useState(false);
  const { selectedUser } = useSelectedUser();

  // Use live price hook to get real-time market price
  const { price: livePrice } = useLivePrice(position.symbol, selectedUser?.id);

  // Priority: passed currentPrice > live price > position.currentPrice > entryPrice as fallback
  const price = currentPrice || livePrice || position.currentPrice || position.entryPrice;

  // Use realized PnL for closed positions, unrealized for open positions
  const isClosedPosition = position.status === "CLOSED";
  const pnlValue = isClosedPosition ? position.pnlPercent : ((price - position.entryPrice) / position.entryPrice) * 100;
  const pnlAmount = isClosedPosition ? position.realizedPnl : (price - position.entryPrice) * position.quantity;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      OPEN: {
        color: "bg-green-100 text-green-800 border-green-200",
        label: "OPEN",
      },
      CLOSED: {
        color: "bg-blue-100 text-blue-800 border-blue-200",
        label: "CLOSED",
      },
      CANCELED: {
        color: "bg-red-100 text-red-800 border-red-200",
        label: "CANCELED",
      },
      MARKET_CLOSED: {
        color: "bg-purple-100 text-purple-800 border-purple-200",
        label: "MARKET CLOSED",
      },
      FAILED: {
        color: "bg-red-100 text-red-800 border-red-200",
        label: "FAILED",
      },
      PENDING: {
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
        label: "PENDING",
      },
      PARTIALLY_FILLED: {
        color: "bg-orange-100 text-orange-800 border-orange-200",
        label: "PARTIAL",
      },
      // Legacy status mapping for backward compatibility
      ENTERED: {
        color: "bg-green-100 text-green-800 border-green-200",
        label: "OPEN",
      },
      COMPLETED: {
        color: "bg-blue-100 text-blue-800 border-blue-200",
        label: "CLOSED",
      },
      CANCELLED: {
        color: "bg-red-100 text-red-800 border-red-200",
        label: "CANCELED",
      },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;

    return (
      <Badge variant="outline" className={`text-xs ${config.color}`}>
        {config.label}
      </Badge>
    );
  };

  const getPnLColor = (value: number) => {
    if (value > 0) return "text-green-600";
    if (value < 0) return "text-red-600";
    return "text-gray-600";
  };

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? "+" : "";
    return `${sign}${value.toFixed(2)}%`;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

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
        <TableCell>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={cn(
                  "text-xs",
                  position.side === "Long"
                    ? "text-green-600 bg-green-50 border-green-200"
                    : "text-red-600 bg-red-50 border-red-200"
                )}
              >
                {position.side}
              </Badge>
              <span className="font-medium">{position.symbol}</span>
              {/* Account Type Badge */}
              <Badge
                variant="outline"
                className={cn(
                  "text-xs",
                  position.accountType === "SPOT"
                    ? "text-blue-600 bg-blue-50 border-blue-200"
                    : "text-purple-600 bg-purple-50 border-purple-200"
                )}
              >
                {position.accountType}
                {position.marginType && ` (${position.marginType})`}
              </Badge>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <span>{position.account.exchange.name}</span>
              {position.botName && (
                <>
                  <span className="text-xs">•</span>
                  <span className="font-medium text-primary">{position.botName}</span>
                </>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              {formatDate(position.entryTime)}
            </div>
          </div>
        </TableCell>
        <TableCell className="text-right">
          <span className="font-mono text-sm">
            ${position.entryPrice?.toFixed(4) || "0.0000"}
          </span>
        </TableCell>
        <TableCell className="text-right">
          <span
            className={cn(
              "font-mono text-sm",
              getPnLColor(position.maxDrawdown)
            )}
          >
            {formatPercentage(position.maxDrawdown)}
          </span>
        </TableCell>
        <TableCell className="text-right">
          <span className="text-muted-foreground font-mono">
            {position.takeProfit ? `$${position.takeProfit.toFixed(4)}` : "-"}
          </span>
        </TableCell>
        <TableCell className="text-right">
          <span className="text-muted-foreground font-mono">
            {position.stopLoss ? `$${position.stopLoss.toFixed(4)}` : "-"}
          </span>
        </TableCell>
        <TableCell className="text-right">
          <span className="text-muted-foreground font-mono">
            {position.breakEven ? `$${position.breakEven.toFixed(4)}` : "-"}
          </span>
        </TableCell>
        <TableCell className="text-right">
          <span className="text-muted-foreground">
            {position.trailing ? `${position.trailing.toFixed(2)}%` : "-"}
          </span>
        </TableCell>
        <TableCell className="text-right">
          <span className="font-medium">{position.portfolioPercent}%</span>
        </TableCell>
        <TableCell className="text-right">
          <div className="flex flex-col items-end">
            <span className={cn("font-mono text-sm", getPnLColor(pnlValue))}>
              {formatPercentage(pnlValue)}
            </span>
            <span className={cn("font-mono text-xs", getPnLColor(pnlAmount))}>
              {pnlAmount >= 0 ? "+" : ""}
              {formatCurrency(pnlAmount)}
            </span>
          </div>
        </TableCell>
        <TableCell className="text-right">
          <span
            className={cn(
              "font-mono text-sm",
              getPnLColor(position.roiPercent)
            )}
          >
            {formatPercentage(position.roiPercent)}
          </span>
        </TableCell>
        <TableCell className="text-center">
          {getStatusBadge(position.status)}
          <MarkPrice
            symbol={position.symbol}
            fallbackPrice={position.currentPrice || position.entryPrice}
            className="mt-1"
            userId={selectedUser?.id}
          />
        </TableCell>
        <TableCell className="text-center">
          <PositionActions
            position={position}
            onAction={handlePositionAction}
            disabled={actionLoading}
          />
        </TableCell>
      </TableRow>

      {/* Expanded Row Content */}
      {isExpanded && (
        <TableRow>
          <TableCell colSpan={13} className="p-0 bg-muted/20">
            <div className="p-4 space-y-4">
              {/* Position Details */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-sm">
                {position.botId && position.botName && (
                  <div>
                    <span className="font-medium text-muted-foreground">
                      Bot Name:
                    </span>
                    <span className="ml-2 font-medium text-primary">{position.botName}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 ml-1"
                      onClick={() =>
                        copyToClipboard(position.botId!, "Bot ID")
                      }
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                )}
                <div>
                  <span className="font-medium text-muted-foreground">
                    Account Type:
                  </span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "ml-2 text-xs",
                      position.accountType === "SPOT"
                        ? "text-blue-600 bg-blue-50 border-blue-200"
                        : "text-purple-600 bg-purple-50 border-purple-200"
                    )}
                  >
                    {position.accountType}
                    {position.marginType && ` (${position.marginType})`}
                  </Badge>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">
                    Exchange:
                  </span>
                  <span className="ml-2">{position.account.exchange.name}</span>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">
                    Entry / Exit:
                  </span>
                  <span className="ml-2">
                    {position.entryPrice.toFixed(2)} /{" "}
                    {isClosedPosition && position.exitPrice
                      ? position.exitPrice.toFixed(2)
                      : isClosedPosition
                        ? "Closed"
                        : "Open"}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">
                    Amount:
                  </span>
                  <span className="ml-2">{position.quantity}</span>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">
                    Status:
                  </span>
                  <span className="ml-2">
                    {getStatusBadge(position.status)}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">
                    Fill:
                  </span>
                  <span className="ml-2">
                    {(
                      (position.filledQuantity / position.quantity) *
                      100
                    ).toFixed(1)}
                    %
                  </span>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">
                    Volume USD:
                  </span>
                  <span className="ml-2">
                    {formatCurrency(position.totalVolume)}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">
                    P/L USD:
                  </span>
                  <span
                    className={cn("ml-2", getPnLColor(pnlAmount))}
                  >
                    {formatCurrency(pnlAmount)}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">
                    Fees:
                  </span>
                  <span className="ml-2">{formatCurrency(position.fees)}</span>
                </div>
              </div>

              {/* Orders Table */}
              <div className="mt-6">
                <h4 className="font-medium mb-3">Order History</h4>
                <OrderHistory orders={position.orders} />
              </div>

              {/* Summary */}
              <div className="mt-4 pt-4 border-t bg-muted/30 rounded p-3">
                <div className="flex justify-between items-center text-sm">
                  <div>
                    <span className="font-medium text-muted-foreground">
                      Total volume turnover:
                    </span>
                    <span className="ml-2 font-mono">
                      {formatCurrency(position.totalVolume)}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">
                      Profit-and-loss:
                    </span>
                    <span
                      className={cn(
                        "ml-2 font-mono",
                        getPnLColor(pnlAmount)
                      )}
                    >
                      {formatCurrency(pnlAmount)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
