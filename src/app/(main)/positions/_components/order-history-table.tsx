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
import { ArrowUpDown, Search, Filter, Calendar, Copy, Clock, History } from "lucide-react";
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
        return "text-green-600 bg-green-50 border-green-200";
      case "SELL":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "FILLED":
        return "text-green-600 bg-green-50 border-green-200";
      case "PENDING":
      case "NEW":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "CANCELED":
      case "CANCELLED":
        return "text-red-600 bg-red-50 border-red-200";
      case "PARTIALLY_FILLED":
        return "text-blue-600 bg-blue-50 border-blue-200";
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
      second: "2-digit",
    });
  };

  const copyOrderId = (orderId: number) => {
    navigator.clipboard.writeText(orderId.toString());
    toast.success("Order ID copied to clipboard");
  };

  // Render table for a given set of orders
  const renderOrderTable = (orderList: ProcessedOrder[], emptyMessage: string) => {
    if (orderList.length === 0) {
      return (
        <div className="text-center py-12">
          <Filter className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground mb-2">
            No orders found
          </h3>
          <p className="text-sm text-muted-foreground">
            {emptyMessage}
          </p>
        </div>
      );
    }

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
                <TableRow key={order.id} className="hover:bg-muted/50">
                  <TableCell className="font-mono text-sm">
                    {formatDate(order.createdAt)}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    <div className="flex items-center gap-1">
                      <span>{order.orderId}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => copyOrderId(order.orderId)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {order.symbol}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {order.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-xs ${getSideColor(order.side)}`}>
                      {order.side}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {order.price === 0 ? "Market" : order.price.toFixed(8)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {order.quantity.toFixed(8)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {order.executedQty.toFixed(8)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(order.value)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-xs ${getStatusColor(order.status)}`}>
                      {order.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        <div className="mt-4 text-sm text-muted-foreground">
          Showing {orderList.length} orders
        </div>
      </>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Orders ({orders.length} total)
        </CardTitle>
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search by symbol..."
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
              <SelectItem value="FILLED">Filled</SelectItem>
              <SelectItem value="NEW">New</SelectItem>
              <SelectItem value="PARTIALLY_FILLED">Partially Filled</SelectItem>
              <SelectItem value="CANCELED">Canceled</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={sideFilter} onValueChange={setSideFilter}>
            <SelectTrigger className="w-full sm:w-[120px]">
              <SelectValue placeholder="Side" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sides</SelectItem>
              <SelectItem value="BUY">Buy</SelectItem>
              <SelectItem value="SELL">Sell</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="open" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="open" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Open Orders ({openOrders.length})
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Order History ({completedOrders.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="open" className="mt-6">
            {renderOrderTable(
              filteredOpenOrders,
              openOrders.length === 0
                ? "No open orders found. Your pending and partially filled orders will appear here."
                : "No open orders match your current filters."
            )}
          </TabsContent>
          
          <TabsContent value="history" className="mt-6">
            {renderOrderTable(
              filteredCompletedOrders,
              completedOrders.length === 0
                ? "No completed orders found. Your filled and canceled orders will appear here."
                : "No completed orders match your current filters."
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
