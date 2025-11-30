"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TrendingDown, Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";
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
import {
  PositionData,
  PositionAction,
  PositionFilters,
} from "@/types/position";
import { PositionRow } from "./position-row";
import { useLivePrices } from "@/hooks/trading/use-live-price";
import axios from "axios";
import { useSelectedUser } from "@/contexts/selected-user-context";

interface AdvancedPositionsTableProps {
  positions?: PositionData[];
}

export function AdvancedPositionsTable({
  positions: propPositions,
}: AdvancedPositionsTableProps) {
  const [selectedTab, setSelectedTab] = useState("live");
  const [filters, setFilters] = useState<PositionFilters>({});
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [isClosingAll, setIsClosingAll] = useState(false);
  const [isForceClosing, setIsForceClosing] = useState(false);
  const [positions, setPositions] = useState<PositionData[]>(
    propPositions || []
  );
  const [loading, setLoading] = useState(false);

  const { selectedUser } = useSelectedUser();

  // Get unique symbols for live price fetching (memoized to prevent infinite re-renders)
  const symbols = useMemo(
    () => [...new Set(positions.map((p) => p.symbol))],
    [positions]
  );
  const { prices: livePrices } = useLivePrices(symbols, selectedUser?.id);

  // Fetch positions from API (only if no props positions provided)
  const fetchPositions = useCallback(async () => {
    // If positions are provided via props, don't fetch from API
    if (propPositions && propPositions.length > 0) {
      return;
    }

    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (filters.status) params.append("status", filters.status);
      if (filters.symbol) params.append("symbol", filters.symbol);
      if (filters.exchange) params.append("exchange", filters.exchange);

      const response = await axios.get(
        `/api/positions?${params.toString()}&userId=${selectedUser?.id}`
      );

      if (response.data.success) {
        setPositions(response.data.data || []);
      } else {
        toast.error("Failed to fetch positions");
        setPositions([]); // Set empty array instead of mock data
      }
    } catch (error) {
      console.error("Error fetching positions:", error);
      toast.error("Failed to fetch positions");
      setPositions([]); // Set empty array instead of mock data
    } finally {
      setLoading(false);
    }
  }, [filters, propPositions, selectedUser?.id]);

  // Fetch positions on component mount and when filters change
  useEffect(() => {
    fetchPositions();
  }, [fetchPositions]);

  // Update positions when props change
  useEffect(() => {
    if (propPositions) {
      setPositions(propPositions);
    }
  }, [propPositions]);

  const toggleRowExpansion = (positionId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(positionId)) {
      newExpanded.delete(positionId);
    } else {
      newExpanded.add(positionId);
    }
    setExpandedRows(newExpanded);
  };

  const handlePositionAction = async (action: PositionAction) => {
    try {
      if (action.type === "CLOSE_POSITION") {
        const response = await axios.post(
          `/api/positions/${action.payload.positionId}/close`,
          { ...action.payload, userId: selectedUser?.id }
        );

        if (response.data.success) {
          toast.success(
            response.data.message || "Position closed successfully"
          );
          // Refresh positions data
          await fetchPositions();
        } else {
          toast.error(response.data.error || "Failed to close position");
        }
      } else {
        toast.info("Action functionality coming soon");
      }
    } catch (error) {
      console.error("Position action failed:", error);
      toast.error("Failed to execute position action");
    }
  };

  const handleCloseAllPositions = async () => {
    setIsClosingAll(true);
    try {
      const openPositions = filteredPositions.filter(
        (p) => p.status === "ENTERED"
      );

      const closePromises = openPositions.map((position) =>
        handlePositionAction({
          type: "CLOSE_POSITION",
          payload: {
            positionId: position.id,
            closeType: "FULL",
            slippage: 1.0,
          },
        })
      );

      await Promise.all(closePromises);
      toast.success(`Closed ${openPositions.length} positions`);
      // Refresh positions data
      await fetchPositions();
    } catch {
      toast.error("Failed to close all positions");
    } finally {
      setIsClosingAll(false);
    }
  };

  const handleForceCloseAll = async () => {
    setIsForceClosing(true);
    try {
      const response = await axios.post("/api/positions/force-close-all", {
        userId: selectedUser?.id
      });

      if (response.data.success) {
        toast.success(response.data.message);
        // Refresh positions data
        await fetchPositions();
      } else {
        toast.error(response.data.error || "Failed to force close positions");
      }
    } catch (error) {
      console.error("Error force closing positions:", error);
      toast.error("Failed to force close positions");
    } finally {
      setIsForceClosing(false);
    }
  };

  const filteredPositions = positions.filter((position) => {
    if (filters.exchange && position.exchange !== filters.exchange)
      return false;
    if (filters.symbol && position.symbol !== filters.symbol) return false;
    if (filters.status && position.status !== filters.status) return false;
    if (filters.side && position.side !== filters.side) return false;
    return true;
  });

  const uniqueExchanges = [...new Set(positions.map((p) => p.exchange))];
  const uniquePairs = [...new Set(positions.map((p) => p.symbol))];
  const uniqueStatuses = [...new Set(positions.map((p) => p.status))];

  return (
    <div className="space-y-4">
      {/* Header Tabs */}
      <Tabs
        value={selectedTab}
        onValueChange={setSelectedTab}
        className="w-full"
      >
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <TabsList className="grid w-full lg:w-auto grid-cols-2 lg:grid-cols-2">
            <TabsTrigger value="live" className="text-sm">
              Live
            </TabsTrigger>
            <TabsTrigger value="history" className="text-sm">
              History
            </TabsTrigger>
          </TabsList>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <Select
              value={filters.exchange || "all"}
              onValueChange={(value) =>
                setFilters((prev) => ({
                  ...prev,
                  exchange: value === "all" ? undefined : value,
                }))
              }
            >
              <SelectTrigger className="w-[140px] h-9 text-sm">
                <SelectValue placeholder="All exchanges" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All exchanges</SelectItem>
                {uniqueExchanges.map((exchange) => (
                  <SelectItem key={exchange} value={exchange}>
                    {exchange}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.symbol || "all"}
              onValueChange={(value) =>
                setFilters((prev) => ({
                  ...prev,
                  symbol: value === "all" ? undefined : value,
                }))
              }
            >
              <SelectTrigger className="w-[120px] h-9 text-sm">
                <SelectValue placeholder="All pairs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All pairs</SelectItem>
                {uniquePairs.map((pair) => (
                  <SelectItem key={pair} value={pair}>
                    {pair}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.status || "all"}
              onValueChange={(value) =>
                setFilters((prev) => ({
                  ...prev,
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  status: value === "all" ? undefined : (value as any),
                }))
              }
            >
              <SelectTrigger className="w-[130px] h-9 text-sm">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {uniqueStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              className="h-9 text-sm text-red-600 hover:text-red-700"
              onClick={handleCloseAllPositions}
              disabled={isClosingAll}
            >
              {isClosingAll ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Closing...
                </>
              ) : (
                "Close All"
              )}
            </Button>

            {positions.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" className="h-9 text-sm">
                    <XCircle className="h-4 w-4 mr-2" />
                    Force Close All (DB Only)
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Force Close All Positions?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will mark all open positions as CLOSED in the database only.
                      No actual trades will be executed on the exchange.

                      This action should only be used for:
                      - Testing/development
                      - Cleaning up stale positions
                      - Emergency database cleanup

                      {positions.length} positions will be affected.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleForceCloseAll}
                      className="bg-red-600 hover:bg-red-700"
                      disabled={isForceClosing}
                    >
                      {isForceClosing ? "Closing..." : "Force Close All"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>

        <TabsContent value="live" className="mt-6">
          <Card>
            <CardContent className="p-0">
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-8"></TableHead>
                      <TableHead className="min-w-[120px]">Position</TableHead>
                      <TableHead className="text-right">Entry %</TableHead>
                      <TableHead className="text-right">Max Drawdown</TableHead>
                      <TableHead className="text-right">TP</TableHead>
                      <TableHead className="text-right">SL</TableHead>
                      <TableHead className="text-right">BE</TableHead>
                      <TableHead className="text-right">Trailing</TableHead>
                      <TableHead className="text-right">Portfolio</TableHead>
                      <TableHead className="text-right">P/L %</TableHead>
                      <TableHead className="text-right">ROI %</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <tr>
                        <td colSpan={13} className="text-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                          <p className="mt-2 text-muted-foreground">
                            Loading positions...
                          </p>
                        </td>
                      </tr>
                    ) : filteredPositions.filter(
                      (p) => p.status === "OPEN" || p.status === "ENTERED"
                    ).length === 0 ? (
                      <tr>
                        <td colSpan={13} className="text-center py-8">
                          <p className="text-muted-foreground">
                            No open positions found
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredPositions
                        .filter(
                          (p) => p.status === "OPEN" || p.status === "ENTERED"
                        )
                        .map((position) => (
                          <PositionRow
                            key={position.id}
                            position={position}
                            isExpanded={expandedRows.has(position.id)}
                            onToggleExpand={() =>
                              toggleRowExpansion(position.id)
                            }
                            onPositionAction={handlePositionAction}
                            currentPrice={livePrices[position.symbol]}
                          />
                        ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <Card>
            <CardContent className="p-0">
              {filteredPositions.filter(
                (p) => p.status === "CLOSED"
              ).length > 0 ? (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="w-8"></TableHead>
                        <TableHead className="min-w-[120px]">
                          Position
                        </TableHead>
                        <TableHead className="text-right">Entry %</TableHead>
                        <TableHead className="text-right">
                          Max Drawdown
                        </TableHead>
                        <TableHead className="text-right">TP</TableHead>
                        <TableHead className="text-right">SL</TableHead>
                        <TableHead className="text-right">BE</TableHead>
                        <TableHead className="text-right">Trailing</TableHead>
                        <TableHead className="text-right">Portfolio</TableHead>
                        <TableHead className="text-right">P/L %</TableHead>
                        <TableHead className="text-right">ROI %</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPositions
                        .filter(
                          (p) =>
                            p.status === "CLOSED"
                        )
                        .map((position) => (
                          <PositionRow
                            key={position.id}
                            position={position}
                            isExpanded={expandedRows.has(position.id)}
                            onToggleExpand={() =>
                              toggleRowExpansion(position.id)
                            }
                            onPositionAction={handlePositionAction}
                            currentPrice={livePrices[position.symbol]}
                          />
                        ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="p-12 text-center">
                  <div className="text-muted-foreground">
                    <TrendingDown className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">
                      No historical positions
                    </h3>
                    <p className="text-sm">Closed positions will appear here</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
