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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProcessedOrder } from "@/db/actions/order/get-orders";
import { 
  ArrowUpDown, 
  Search, 
  Clock, 
  History, 
  Copy, 
  ExternalLink,
  TrendingUp,
  TrendingDown,
  Activity,
  CheckCircle,
  XCircle,
  AlertCircle,
  Pause
} from "lucide-react";
import { formatCurrency } from "@/lib/mock-data";
import { toast } from "sonner";

interface OrderHistoryTableProps {
  orders: ProcessedOrder[];
}

type SortField = "createdAt" | "symbol" | "price" | "quantity" | "value";
type SortDirection = "asc" | "desc";

export function OrderHistoryTable({ orders }: OrderHistoryTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sideFilter, setSideFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Separate open orders from completed orders
  const openOrders = orders.filter((order) => {
    const status = order.status.toUpperCase();
    return status === "NEW" || status === "PENDING" || status === "PARTIALLY_FILLED";
  });

  const completedOrders = orders.filter((order) => {
    const status = order.status.toUpperCase();
    return status === "FILLED" || status === "CANCELED" || status === "CANCELLED" || status === "REJECTED" || status === "EXPIRED";
  });

  // Filter function for both tabs
  const filterOrders = (orderList: ProcessedOrder[]) => {
    return orderList.filter((order) => {
      const matchesSearch = order.symbol.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || order.status === statusFilter;
      const matchesSide = sideFilter === "all" || order.side === sideFilter;
      
      return matchesSearch && matchesStatus && matchesSide;
    });
  };

  // Sort function
  const sortOrders = (orderList: ProcessedOrder[]) => {
    return [...orderList].sort((a, b) => {
      let aValue: string | number = a[sortField];
      let bValue: string | number = b[sortField];

      if (sortField === "createdAt") {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      } else if (typeof aValue === "string" && typeof bValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortDirection === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  };

  // Get filtered and sorted orders for each tab
  const filteredOpenOrders = sortOrders(filterOrders(openOrders));
  const filteredCompletedOrders = sortOrders(filterOrders(completedOrders));

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const getSideColor = (side: string) => {
    switch (side.toUpperCase()) {
      case "BUY":
        return "text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100";
      case "SELL":
        return "text-rose-700 bg-rose-50 border-rose-200 hover:bg-rose-100";
      default:
        return "text-slate-700 bg-slate-50 border-slate-200 hover:bg-slate-100";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "FILLED":
        return "text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100";
      case "PENDING":
      case "NEW":
        return "text-amber-700 bg-amber-50 border-amber-200 hover:bg-amber-100";
      case "CANCELED":
      case "CANCELLED":
        return "text-rose-700 bg-rose-50 border-rose-200 hover:bg-rose-100";
      case "PARTIALLY_FILLED":
        return "text-blue-700 bg-blue-50 border-blue-200 hover:bg-blue-100";
      case "REJECTED":
        return "text-red-700 bg-red-50 border-red-200 hover:bg-red-100";
      case "EXPIRED":
        return "text-gray-700 bg-gray-50 border-gray-200 hover:bg-gray-100";
      default:
        return "text-slate-700 bg-slate-50 border-slate-200 hover:bg-slate-100";
    }
  };

  const getSideIcon = (side: string) => {
    switch (side.toUpperCase()) {
      case "BUY":
        return <TrendingUp className="h-3 w-3" />;
      case "SELL":
        return <TrendingDown className="h-3 w-3" />;
      default:
        return <Activity className="h-3 w-3" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toUpperCase()) {
      case "FILLED":
        return <CheckCircle className="h-3 w-3" />;
      case "PENDING":
      case "NEW":
        return <Clock className="h-3 w-3" />;
      case "CANCELED":
      case "CANCELLED":
        return <XCircle className="h-3 w-3" />;
      case "PARTIALLY_FILLED":
        return <AlertCircle className="h-3 w-3" />;
      case "REJECTED":
        return <XCircle className="h-3 w-3" />;
      case "EXPIRED":
        return <Pause className="h-3 w-3" />;
      default:
        return <Activity className="h-3 w-3" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const copyOrderId = (orderId: number) => {
    navigator.clipboard.writeText(orderId.toString());
    toast.success("Order ID copied to clipboard");
  };

  const getOrderTypeColor = (type: string) => {
    switch (type.toUpperCase()) {
      case "MARKET":
        return "text-purple-700 bg-purple-50 border-purple-200";
      case "LIMIT":
        return "text-blue-700 bg-blue-50 border-blue-200";
      case "STOP_LOSS":
      case "STOP":
        return "text-red-700 bg-red-50 border-red-200";
      case "TAKE_PROFIT":
        return "text-green-700 bg-green-50 border-green-200";
      default:
        return "text-slate-700 bg-slate-50 border-slate-200";
    }
  };

  // Calculate totals for summary
  const calculateSummary = (orderList: ProcessedOrder[]) => {
    const totalValue = orderList.reduce((sum, order) => sum + order.value, 0);
    const totalOrders = orderList.length;
    const avgOrderSize = totalOrders > 0 ? totalValue / totalOrders : 0;
    
    return { totalValue, totalOrders, avgOrderSize };
  };

  // Render table for a given set of orders
  const renderOrderTable = (orderList: ProcessedOrder[], emptyMessage: string) => {
    if (orderList.length === 0) {
      return (
        <div className="text-center py-16">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 bg-muted/20 rounded-full flex items-center justify-center">
              <History className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No orders found
          </h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            {emptyMessage}
          </p>
        </div>
      );
    }

    const summary = calculateSummary(orderList);

    return (
      <>
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
                    Order Time
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>Order ID</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 font-medium"
                    onClick={() => handleSort("symbol")}
                  >
                    Pair
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Side</TableHead>
                <TableHead className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 font-medium"
                    onClick={() => handleSort("price")}
                  >
                    Price
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
                <TableHead className="text-right">Executed</TableHead>
                <TableHead className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 font-medium"
                    onClick={() => handleSort("value")}
                  >
                    Total Value
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orderList.map((order) => (
                <TableRow key={order.id} className="hover:bg-muted/30 transition-colors group">
                  <TableCell className="font-mono text-sm">
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {formatDate(order.createdAt).split(', ')[0]}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(order.createdAt).split(', ')[1]}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">#{order.orderId}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => copyOrderId(order.orderId)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {order.symbol.slice(0, 2)}
                      </div>
                      <span className="font-semibold">{order.symbol}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-xs font-medium ${getOrderTypeColor(order.type)}`}>
                      {order.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-xs font-medium flex items-center gap-1 w-fit ${getSideColor(order.side)}`}>
                      {getSideIcon(order.side)}
                      {order.side}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="font-mono">
                      {order.price === 0 ? (
                        <span className="text-purple-600 font-medium">Market</span>
                      ) : (
                        <span>${order.price.toFixed(6)}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    <div className="flex flex-col items-end">
                      <span>{order.quantity.toFixed(6)}</span>
                      <span className="text-xs text-muted-foreground">
                        {order.symbol.replace('USDT', '').replace('BUSD', '')}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    <div className="flex flex-col items-end">
                      <span className={order.executedQty > 0 ? "text-green-600" : "text-muted-foreground"}>
                        {order.executedQty.toFixed(6)}
                      </span>
                      {order.quantity > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {((order.executedQty / order.quantity) * 100).toFixed(1)}%
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="font-mono font-semibold">
                      {formatCurrency(order.value)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-xs font-medium flex items-center gap-1 w-fit ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                      {order.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {/* Summary Statistics */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-1">
              <History className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">Total Orders</span>
            </div>
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
              {summary.totalOrders.toLocaleString()}
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/50 dark:to-green-950/50 p-4 rounded-lg border border-emerald-200 dark:border-emerald-800">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              <span className="text-sm font-medium text-emerald-900 dark:text-emerald-100">Total Volume</span>
            </div>
            <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
              {formatCurrency(summary.totalValue)}
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/50 dark:to-violet-950/50 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-900 dark:text-purple-100">Avg Order Size</span>
            </div>
            <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
              {formatCurrency(summary.avgOrderSize)}
            </div>
          </div>
        </div>
        
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <span>Showing {orderList.length} orders</span>
          <Button variant="outline" size="sm" className="gap-2">
            <ExternalLink className="h-3 w-3" />
            View on Binance
          </Button>
        </div>
      </>
    );
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-900 dark:to-gray-900 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3">
            <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <History className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="text-xl font-bold">Order History</div>
              <div className="text-sm text-muted-foreground font-normal">
                {orders.length} total orders • {openOrders.length} active • {completedOrders.length} completed
              </div>
            </div>
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-white dark:bg-slate-800">
              <Activity className="h-3 w-3 mr-1" />
              Binance
            </Badge>
            <Button variant="outline" size="sm" className="gap-2">
              <ExternalLink className="h-3 w-3" />
              Exchange
            </Button>
          </div>
        </div>
        
        {/* Enhanced Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search by symbol or order ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-white dark:bg-slate-800"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="bg-white dark:bg-slate-800">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="FILLED">✅ Filled</SelectItem>
              <SelectItem value="NEW">🔵 New</SelectItem>
              <SelectItem value="PARTIALLY_FILLED">🔄 Partially Filled</SelectItem>
              <SelectItem value="CANCELED">❌ Canceled</SelectItem>
              <SelectItem value="REJECTED">🚫 Rejected</SelectItem>
              <SelectItem value="EXPIRED">⏰ Expired</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={sideFilter} onValueChange={setSideFilter}>
            <SelectTrigger className="bg-white dark:bg-slate-800">
              <SelectValue placeholder="Filter by side" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sides</SelectItem>
              <SelectItem value="BUY">📈 Buy Orders</SelectItem>
              <SelectItem value="SELL">📉 Sell Orders</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        <Tabs defaultValue="open" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-12 p-1 bg-muted/30">
            <TabsTrigger value="open" className="flex items-center gap-2 h-10 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span className="font-medium">Active Orders</span>
                <Badge variant="secondary" className="text-xs font-semibold">
                  {openOrders.length}
                </Badge>
              </div>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2 h-10 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4" />
                <span className="font-medium">Completed Orders</span>
                <Badge variant="secondary" className="text-xs font-semibold">
                  {completedOrders.length}
                </Badge>
              </div>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="open" className="mt-6 space-y-0">
            {renderOrderTable(
              filteredOpenOrders,
              openOrders.length === 0
                ? "No active orders found. Your pending and partially filled orders will appear here when you place new orders."
                : "No active orders match your current search and filter criteria. Try adjusting your filters."
            )}
          </TabsContent>
          
          <TabsContent value="history" className="mt-6 space-y-0">
            {renderOrderTable(
              filteredCompletedOrders,
              completedOrders.length === 0
                ? "No order history found. Your completed, filled, and canceled orders will appear here after trading."
                : "No completed orders match your current search and filter criteria. Try adjusting your filters."
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
