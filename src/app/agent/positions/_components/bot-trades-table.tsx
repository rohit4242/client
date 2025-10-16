"use client";

import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpDown, Search, Bot } from "lucide-react";
import { formatCurrency } from "@/lib/mock-data";

interface BotTradesTableProps {
  trades: Array<{
    id: string;
    symbol: string;
    side: string;
    entryPrice: string | number;
    quantity: string | number;
    entryTime: string | Date;
    createdAt: string | Date;
    status: string;
    tradeType: string;
    exitPrice?: string | number | null;
    profit?: string | number | null;
    profitPercentage?: string | number | null;
    bot: {
      name: string;
    };
  }>;
}

type SortField = "createdAt" | "symbol" | "entryPrice" | "quantity" | "profit";
type SortDirection = "asc" | "desc";

export function BotTradesTable({ trades }: BotTradesTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sideFilter, setSideFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Filter function
  const filterTrades = () => {
    return trades.filter((trade) => {
      const matchesSearch = trade.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           trade.bot.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || trade.status === statusFilter;
      const matchesSide = sideFilter === "all" || trade.side === sideFilter;
      
      return matchesSearch && matchesStatus && matchesSide;
    });
  };

  // Sort function
  const sortTrades = (tradeList: typeof trades) => {
    return [...tradeList].sort((a, b) => {
      let aValue: number;
      let bValue: number;

      if (sortField === "createdAt") {
        aValue = new Date(a.createdAt).getTime();
        bValue = new Date(b.createdAt).getTime();
      } else if (sortField === "entryPrice") {
        aValue = Number(a.entryPrice) || 0;
        bValue = Number(b.entryPrice) || 0;
      } else if (sortField === "quantity") {
        aValue = Number(a.quantity) || 0;
        bValue = Number(b.quantity) || 0;
      } else if (sortField === "profit") {
        aValue = Number(a.profit) || 0;
        bValue = Number(b.profit) || 0;
      } else {
        aValue = 0;
        bValue = 0;
      }

      if (sortDirection === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  };

  // Get filtered and sorted trades
  const filteredTrades = sortTrades(filterTrades());

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const getSideColor = (side: string) => {
    switch (side) {
      case "Long":
        return "text-green-600 bg-green-50 border-green-200";
      case "Short":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Open":
        return "text-blue-600 bg-blue-50 border-blue-200";
      case "Closed":
        return "text-green-600 bg-green-50 border-green-200";
      case "Canceled":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getTradeTypeColor = (tradeType: string) => {
    switch (tradeType) {
      case "Signal":
        return "text-purple-600 bg-purple-50 border-purple-200";
      case "DCA":
        return "text-blue-600 bg-blue-50 border-blue-200";
      case "StopLoss":
        return "text-red-600 bg-red-50 border-red-200";
      case "TakeProfit":
        return "text-green-600 bg-green-50 border-green-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const calculatePnL = (trade: typeof trades[0]) => {
    if (trade.status === "Closed" && trade.profit !== null) {
      return Number(trade.profit);
    }
    return null;
  };

  const calculatePnLPercentage = (trade: typeof trades[0]) => {
    if (trade.status === "Closed" && trade.profitPercentage !== null) {
      return Number(trade.profitPercentage);
    }
    return null;
  };

  if (filteredTrades.length === 0) {
    return (
      <Card>
        <CardContent className="p-12">
          <div className="text-center">
            <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              No bot trades found
            </h3>
            <p className="text-sm text-muted-foreground">
              {trades.length === 0 
                ? "Start using Signal Bots to see automated trades here."
                : "No trades match your current filters."
              }
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          Bot Trades ({trades.length} total)
        </CardTitle>
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search by symbol or bot name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Open">Open</SelectItem>
              <SelectItem value="Closed">Closed</SelectItem>
              <SelectItem value="Canceled">Canceled</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={sideFilter} onValueChange={setSideFilter}>
            <SelectTrigger className="w-full sm:w-[120px]">
              <SelectValue placeholder="Side" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sides</SelectItem>
              <SelectItem value="Long">Long</SelectItem>
              <SelectItem value="Short">Short</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 font-medium"
                    onClick={() => handleSort("createdAt")}
                  >
                    Entry Time
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>Bot Name</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 font-medium"
                    onClick={() => handleSort("symbol")}
                  >
                    Symbol
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>Side</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 font-medium"
                    onClick={() => handleSort("entryPrice")}
                  >
                    Entry Price
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 font-medium"
                    onClick={() => handleSort("quantity")}
                  >
                    Quantity
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="text-right">Exit Price</TableHead>
                <TableHead className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 font-medium"
                    onClick={() => handleSort("profit")}
                  >
                    P&L
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTrades.map((trade) => {
                const pnl = calculatePnL(trade);
                const pnlPercentage = calculatePnLPercentage(trade);
                
                return (
                  <TableRow key={trade.id} className="hover:bg-muted/50">
                    <TableCell className="font-mono text-sm">
                      {formatDate(trade.entryTime.toString())}
                    </TableCell>
                    <TableCell className="font-medium">
                      {trade.bot.name}
                    </TableCell>
                    <TableCell className="font-medium">
                      {trade.symbol}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs ${getSideColor(trade.side)}`}>
                        {trade.side}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs ${getTradeTypeColor(trade.tradeType)}`}>
                        {trade.tradeType}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      ${Number(trade.entryPrice).toFixed(4)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {Number(trade.quantity).toFixed(6)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {trade.exitPrice ? `$${Number(trade.exitPrice).toFixed(4)}` : "-"}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {pnl !== null ? (
                        <div className="flex flex-col items-end">
                          <span className={pnl >= 0 ? "text-green-600" : "text-red-600"}>
                            {pnl >= 0 ? "+" : ""}{formatCurrency(pnl)}
                          </span>
                          {pnlPercentage !== null && (
                            <span className={`text-xs ${pnlPercentage >= 0 ? "text-green-600" : "text-red-600"}`}>
                              {pnlPercentage >= 0 ? "+" : ""}{pnlPercentage.toFixed(2)}%
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs ${getStatusColor(trade.status)}`}>
                        {trade.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        
        <div className="mt-4 text-sm text-muted-foreground">
          Showing {filteredTrades.length} of {trades.length} bot trades
        </div>
      </CardContent>
    </Card>
  );
}
    