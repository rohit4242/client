"use client";

import { useState, useEffect } from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpDown, Search, TrendingUp, X } from "lucide-react";
import { formatCurrency } from "@/lib/mock-data";
import { toast } from "sonner";
import axios from "axios";
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
interface LivePositionsTableProps {
  positions: Array<{
    id: string;
    symbol: string;
    side: string;
    entryPrice: string | number;
    quantity: string | number;
    entryTime: string | Date;
    createdAt: string | Date;
    bot: {
      name: string;
      portfolioPercent: number;
    };
  }>;
}

type SortField = "createdAt" | "symbol" | "entryPrice" | "quantity" | "currentValue";
type SortDirection = "asc" | "desc";

export function LivePositionsTable({ positions }: LivePositionsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [currentPrices, setCurrentPrices] = useState<{ [key: string]: number }>({});
  const [loadingPrices, setLoadingPrices] = useState(true);
  const [closingPosition, setClosingPosition] = useState<string | null>(null);

  // Fetch current prices for all symbols
  useEffect(() => {
    const fetchPrices = async () => {
      const symbols = [...new Set(positions.map(p => p.symbol))];
      const pricePromises = symbols.map(async (symbol) => {
        try {
          const response = await axios.get(`/api/trading/price/${symbol}`);
          return { symbol, price: parseFloat(response.data.price) };
        } catch (error) {
          console.error(`Error fetching price for ${symbol}:`, error);
          return { symbol, price: 0 };
        }
      });

      const prices = await Promise.all(pricePromises);
      const priceMap = prices.reduce((acc, { symbol, price }) => {
        acc[symbol] = price;
        return acc;
      }, {} as { [key: string]: number });

      setCurrentPrices(priceMap);
      setLoadingPrices(false);
    };

    if (positions.length > 0) {
      fetchPrices();
      // Update prices every 30 seconds
      const interval = setInterval(fetchPrices, 30000);
      return () => clearInterval(interval);
    } else {
      setLoadingPrices(false);
    }
  }, [positions]);

  // Filter function
  const filterPositions = () => {
    return positions.filter((position) => {
      const matchesSearch = position.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           position.bot.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  };

  // Sort function
  const sortPositions = (positionList: typeof positions) => {
    return [...positionList].sort((a, b) => {
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
      } else if (sortField === "currentValue") {
        const aPrice = currentPrices[a.symbol] || Number(a.entryPrice);
        const bPrice = currentPrices[b.symbol] || Number(b.entryPrice);
        aValue = aPrice * Number(a.quantity);
        bValue = bPrice * Number(b.quantity);
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

  // Get filtered and sorted positions
  const filteredPositions = sortPositions(filterPositions());

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const calculateUnrealizedPnL = (position: typeof positions[0]) => {
    const currentPrice = currentPrices[position.symbol];
    if (!currentPrice) return { pnl: 0, percentage: 0 };

    const entryPrice = Number(position.entryPrice);
    const quantity = Number(position.quantity);
    
    let pnl = 0;
    if (position.side === "Long") {
      pnl = (currentPrice - entryPrice) * quantity;
    } else {
      pnl = (entryPrice - currentPrice) * quantity;
    }

    const percentage = ((currentPrice - entryPrice) / entryPrice) * 100;
    
    return { 
      pnl, 
      percentage: position.side === "Short" ? -percentage : percentage 
    };
  };

  const closePosition = async (positionId: string) => {
    setClosingPosition(positionId);
    try {
      await axios.post(`/api/positions/${positionId}/close`);
      toast.success("Position closed successfully");
      // Refresh the page to update positions
      window.location.reload();
    } catch (error) {
      console.error("Error closing position:", error);
      toast.error("Failed to close position");
    } finally {
      setClosingPosition(null);
    }
  };

  if (filteredPositions.length === 0) {
    return (
      <Card>
        <CardContent className="p-12">
          <div className="text-center">
            <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              No open positions
            </h3>
            <p className="text-sm text-muted-foreground">
              {positions.length === 0 
                ? "Your Signal Bot positions will appear here when trades are executed."
                : "No positions match your current filters."
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
          <TrendingUp className="h-5 w-5" />
          Live Positions ({positions.length} open)
        </CardTitle>
        
        {/* Search */}
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
                <TableHead className="text-right">Current Price</TableHead>
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
                <TableHead className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 font-medium"
                    onClick={() => handleSort("currentValue")}
                  >
                    Current Value
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="text-right">Unrealized P&L</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPositions.map((position) => {
                const currentPrice = currentPrices[position.symbol];
                const { pnl, percentage } = calculateUnrealizedPnL(position);
                const currentValue = currentPrice ? currentPrice * Number(position.quantity) : 0;
                
                return (
                  <TableRow key={position.id} className="hover:bg-muted/50">
                    <TableCell className="font-mono text-sm">
                      {formatDate(position.entryTime.toLocaleString())}
                    </TableCell>
                    <TableCell className="font-medium">
                      {position.bot.name}
                    </TableCell>
                    <TableCell className="font-medium">
                      {position.symbol}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs ${getSideColor(position.side)}`}>
                        {position.side}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      ${Number(position.entryPrice).toFixed(4)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {loadingPrices || !currentPrice ? (
                        <span className="text-muted-foreground">Loading...</span>
                      ) : (
                        <span className={
                          currentPrice > Number(position.entryPrice) 
                            ? "text-green-600" 
                            : currentPrice < Number(position.entryPrice)
                            ? "text-red-600"
                            : ""
                        }>
                          ${currentPrice.toFixed(4)}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {Number(position.quantity).toFixed(6)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {currentValue > 0 ? formatCurrency(currentValue) : "-"}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {!loadingPrices && currentPrice ? (
                        <div className="flex flex-col items-end">
                          <span className={pnl >= 0 ? "text-green-600" : "text-red-600"}>
                            {pnl >= 0 ? "+" : ""}{formatCurrency(pnl)}
                          </span>
                          <span className={`text-xs ${percentage >= 0 ? "text-green-600" : "text-red-600"}`}>
                            {percentage >= 0 ? "+" : ""}{percentage.toFixed(2)}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="h-8 w-8 p-0"
                            disabled={closingPosition === position.id}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Close Position</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to close this {position.side.toLowerCase()} position for {position.symbol}?
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => closePosition(position.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Close Position
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        
        <div className="mt-4 text-sm text-muted-foreground">
          Showing {filteredPositions.length} of {positions.length} open positions
        </div>
      </CardContent>
    </Card>
  );
}
