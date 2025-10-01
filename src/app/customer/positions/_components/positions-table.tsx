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
                      <TableHead>Side</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Entry Price</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Current Price</TableHead>
                      <TableHead className="text-right">P&L</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPositions.map((position) => (
                      <TableRow key={position.id}>
                        <TableCell className="font-semibold">
                          {position.symbol}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {position.side === "LONG" ? (
                              <TrendingUp className="h-4 w-4 text-green-500" />
                            ) : (
                              <TrendingDown className="h-4 w-4 text-red-500" />
                            )}
                            <span
                              className={
                                position.side === "LONG"
                                  ? "text-green-500"
                                  : "text-red-500"
                              }
                            >
                              {position.side}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{position.type}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(position.entryPrice)}
                        </TableCell>
                        <TableCell className="text-right">
                          {position.quantity}
                        </TableCell>
                        <TableCell className="text-right">
                          {position.currentPrice
                            ? formatCurrency(position.currentPrice)
                            : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div
                            className={`font-semibold ${
                              position.pnl >= 0 ? "text-green-500" : "text-red-500"
                            }`}
                          >
                            {formatCurrency(position.pnl)}
                            <div className="text-xs">
                              ({position.pnlPercent >= 0 ? "+" : ""}
                              {position.pnlPercent.toFixed(2)}%)
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(position.status)}>
                            {position.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{position.source}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(position.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))}
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

