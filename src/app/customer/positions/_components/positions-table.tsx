"use client";

import { RecentPosition } from "@/db/actions/customer/get-recent-positions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCryptoPrice } from "@/hooks/trading/use-crypto-price";
import { useMemo } from "react";

interface PositionsTableProps {
  positions: RecentPosition[];
}

export function PositionsTable({ positions }: PositionsTableProps) {
  const [filter, setFilter] = useState<"all" | "open" | "closed">("all");

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "OPEN":
        return "default";
      case "CLOSED":
        return "secondary";
      case "CANCELED":
        return "destructive";
      default:
        return "outline";
    }
  };

  const filteredPositions = positions.filter((position) => {
    if (filter === "all") return true;
    if (filter === "open") return position.status === "OPEN";
    if (filter === "closed") return position.status === "CLOSED";
    return true;
  });

  const openPositions = positions.filter((p) => p.status === "OPEN").length;
  const closedPositions = positions.filter((p) => p.status === "CLOSED").length;

  // Get unique symbols for active positions to subscribe to
  const activeSymbols = useMemo(() => {
    return Array.from(new Set(
      positions
        .filter(p => p.status === "OPEN")
        .map(p => p.symbol)
    ));
  }, [positions]);

  const { prices, isConnected } = useCryptoPrice(activeSymbols);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>All Positions</CardTitle>
          <div className="flex gap-2">
            <Badge variant="outline">
              {openPositions} Open
            </Badge>
            <Badge variant="secondary">
              {closedPositions} Closed
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={filter} onValueChange={(value) => setFilter(value as typeof filter)}>
          <TabsList className="mb-4">
            <TabsTrigger value="all">All ({positions.length})</TabsTrigger>
            <TabsTrigger value="open">Open ({openPositions})</TabsTrigger>
            <TabsTrigger value="closed">Closed ({closedPositions})</TabsTrigger>
          </TabsList>

          <TabsContent value={filter} className="mt-0">
            {filteredPositions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No positions to display</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Symbol</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Entry Price</TableHead>
                      <TableHead className="text-right">Current Price</TableHead>
                      <TableHead className="text-right">P&L (Est.)</TableHead>
                      <TableHead className="text-right">SL / TP</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPositions.map((position) => {
                      // Logic for live price and PnL
                      const livePriceData = prices[position.symbol];
                      const currentPrice = livePriceData
                        ? parseFloat(livePriceData.price)
                        : (position.currentPrice || position.entryPrice);

                      // Calculate PnL if open, otherwise use stored PnL
                      let displayPnl = position.pnl;
                      let displayPnlPercent = position.pnlPercent;

                      if (position.status === "OPEN" && currentPrice > 0) {
                        const entryVal = position.entryPrice * position.quantity;
                        const currentVal = currentPrice * position.quantity;

                        if (position.side === "LONG") {
                          displayPnl = currentVal - entryVal;
                        } else {
                          displayPnl = entryVal - currentVal;
                        }

                        displayPnlPercent = (displayPnl / entryVal) * 100;
                      }

                      return (
                        <TableRow key={position.id}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-semibold">{position.symbol}</span>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <span className={position.side === "LONG" ? "text-green-500" : "text-red-500"}>
                                  {position.side}
                                </span>
                                <span>•</span>
                                <span>{position.accountType}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{position.type}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex flex-col">
                              <span>{formatCurrency(position.entryPrice)}</span>
                              <span className="text-xs text-muted-foreground">{position.quantity} units</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className={isConnected && prices[position.symbol] ? "text-blue-500" : ""}>
                              {formatCurrency(currentPrice)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div
                              className={`font-semibold ${displayPnl >= 0 ? "text-green-500" : "text-red-500"
                                }`}
                            >
                              {formatCurrency(displayPnl)}
                              <div className="text-xs">
                                ({displayPnlPercent >= 0 ? "+" : ""}
                                {displayPnlPercent.toFixed(2)}%)
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right text-xs">
                            <div className="flex flex-col gap-1 items-end">
                              {position.stopLoss ? (
                                <div className="flex gap-1 items-center">
                                  <span className="text-muted-foreground">SL:</span>
                                  <span>{formatCurrency(position.stopLoss)}</span>
                                  {position.stopLossStatus && (
                                    <Badge variant="outline" className="h-4 px-1 text-[10px]">{position.stopLossStatus}</Badge>
                                  )}
                                </div>
                              ) : <span className="text-muted-foreground">-</span>}

                              {position.takeProfit ? (
                                <div className="flex gap-1 items-center">
                                  <span className="text-muted-foreground">TP:</span>
                                  <span>{formatCurrency(position.takeProfit)}</span>
                                  {position.takeProfitStatus && (
                                    <Badge variant="outline" className="h-4 px-1 text-[10px]">{position.takeProfitStatus}</Badge>
                                  )}
                                </div>
                              ) : <span className="text-muted-foreground">-</span>}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusColor(position.status)}>
                              {position.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(position.createdAt)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

