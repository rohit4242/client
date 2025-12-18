"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { PositionOrder, OrderStatus, OrderType } from "@/features/position";
import { cn, formatDate } from "@/lib/utils";

interface OrderHistoryProps {
  orders: PositionOrder[];
  loading?: boolean;
}

export function OrderHistory({ orders, loading = false }: OrderHistoryProps) {
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const getStatusBadge = (status: OrderStatus) => {
    const statusConfig = {
      COMPLETED: { color: "bg-green-100 text-green-800 border-green-200", label: "COMPLETED" },
      NEW: { color: "bg-blue-100 text-blue-800 border-blue-200", label: "NEW" },
      CANCELED: { color: "bg-red-100 text-red-800 border-red-200", label: "CANCELED" },
      PARTIALLY_FILLED: { color: "bg-yellow-100 text-yellow-800 border-yellow-200", label: "PARTIALLY_FILLED" },
      REJECTED: { color: "bg-red-100 text-red-800 border-red-200", label: "REJECTED" },
      EXPIRED: { color: "bg-gray-100 text-gray-800 border-gray-200", label: "EXPIRED" },
      FILLED: { color: "bg-green-100 text-green-800 border-green-200", label: "FILLED" },
      PENDING: { color: "bg-yellow-100 text-yellow-800 border-yellow-200", label: "PENDING" },
      OPEN: { color: "bg-blue-100 text-blue-800 border-blue-200", label: "OPEN" },
      MARKET_CLOSED: { color: "bg-purple-100 text-purple-800 border-purple-200", label: "MARKET_CLOSED" }
    };

    const config = statusConfig[status] || statusConfig.NEW;

    return (
      <Badge variant="outline" className={`text-xs ${config.color}`}>
        {config.label}
      </Badge>
    );
  };

  const getTypeBadge = (type: OrderType, side: string) => {
    const typeConfig = {
      ENTRY: { color: "text-blue-600 bg-blue-50 border-blue-200" },
      EXIT: { color: "text-orange-600 bg-orange-50 border-orange-200" },
      MARKET: { color: "text-purple-600 bg-purple-50 border-purple-200" },
      LIMIT: { color: "text-green-600 bg-green-50 border-green-200" },
      STOP: { color: "text-red-600 bg-red-50 border-red-200" },
      STOP_LIMIT: { color: "text-red-600 bg-red-50 border-red-200" }
    };

    const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.MARKET;

    return (
      <div className="flex flex-col gap-1">
        <Badge variant="outline" className={`text-xs ${config.color}`}>
          {type}
        </Badge>
        {side && (
          <Badge
            variant="outline"
            className={cn(
              "text-xs",
              side === "BUY" ? "text-green-600 bg-green-50 border-green-200" : "text-red-600 bg-red-50 border-red-200"
            )}
          >
            {side}
          </Badge>
        )}
      </div>
    );
  };


  if (loading) {
    return (
      <div className="rounded-md border bg-background">
        <div className="p-8 text-center">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4 mx-auto"></div>
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-4 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="rounded-md border bg-background">
        <div className="p-8 text-center text-muted-foreground">
          <p>No orders found for this position</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-md border bg-background">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order ID</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="text-right">Filled</TableHead>
            <TableHead className="text-right">Remaining</TableHead>
            <TableHead>Created at</TableHead>
            <TableHead>Last updated at</TableHead>
            <TableHead className="text-center">Status</TableHead>
            <TableHead className="text-center">Details</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id} className="hover:bg-muted/50">
              <TableCell className="font-mono text-sm">
                <div className="flex items-center gap-2">
                  <span className="truncate max-w-[120px]" title={order.id}>
                    {order.id}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 opacity-60 hover:opacity-100"
                    onClick={() => copyToClipboard(order.id, "Order ID")}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </TableCell>
              <TableCell>
                {getTypeBadge(order.type, order.side)}
              </TableCell>
              <TableCell className="text-right font-mono">
                {(order.price ?? 0) > 0 ? (
                  `$${(order.price ?? 0).toFixed(4)}`
                ) : (order.averagePrice ?? 0) > 0 ? (
                  <div className="flex flex-col items-end">
                    <span>${(order.averagePrice ?? 0).toFixed(4)}</span>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">Avg</span>
                  </div>
                ) : "-"}
              </TableCell>
              <TableCell className="text-right font-mono">
                {(order.amount ?? 0) > 0 ? (order.amount ?? 0).toFixed(6) : "0"}
              </TableCell>
              <TableCell className="text-right font-mono">
                <div className="flex flex-col items-end">
                  <span>{(order.filled ?? 0).toFixed(6)}</span>
                  <span className="text-xs text-muted-foreground">
                    {(order.fill ?? 0).toFixed(1)}%
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-right font-mono">
                {(order.remaining ?? 0).toFixed(6)}
              </TableCell>
              <TableCell className="font-mono text-sm">
                {formatDate(order.createdAt)}
              </TableCell>
              <TableCell className="font-mono text-sm">
                {formatDate(order.lastUpdatedAt)}
              </TableCell>
              <TableCell className="text-center">
                {getStatusBadge(order.status)}
              </TableCell>
              <TableCell className="text-center">
                <div className="flex items-center justify-center gap-1">
                  {order.fees && (
                    <span className="text-xs text-muted-foreground">
                      Fee: ${order.fees.toFixed(4)}
                    </span>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
                    onClick={() => {
                      toast.info("Order details functionality coming soon");
                    }}
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
