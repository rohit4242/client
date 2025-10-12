"use client";

import { CustomerOrder } from "@/db/actions/customer/get-orders";
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
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

interface OrdersTableProps {
  orders: CustomerOrder[];
}

export function OrdersTable({ orders }: OrdersTableProps) {
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
      case "FILLED":
      case "COMPLETED":
        return "default";
      case "PENDING":
      case "NEW":
        return "secondary";
      case "PARTIALLY_FILLED":
        return "outline";
      case "CANCELED":
      case "REJECTED":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getTypeColor = (type: string) => {
    return type === "ENTRY" ? "text-green-500" : "text-red-500";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Order History</CardTitle>
          <Badge variant="outline">{orders.length} Orders</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No orders yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Your order history will appear here
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Side</TableHead>
                  <TableHead>Order Type</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead className="text-right">Fill %</TableHead>
                  <TableHead className="text-right">P&L</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-sm">
                      {order.orderId.substring(0, 8)}...
                    </TableCell>
                    <TableCell className="font-semibold">
                      {order.symbol}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={getTypeColor(order.type)}
                      >
                        {order.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {order.side === "BUY" ? (
                          <ArrowUpRight className="h-4 w-4 text-green-500" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4 text-red-500" />
                        )}
                        <span
                          className={
                            order.side === "BUY"
                              ? "text-green-500"
                              : "text-red-500"
                          }
                        >
                          {order.side}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{order.orderType}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(order.price)}
                    </TableCell>
                    <TableCell className="text-right">
                      {order.quantity}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(order.value)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={
                          order.fillPercent === 100
                            ? "text-green-500"
                            : "text-yellow-500"
                        }
                      >
                        {order.fillPercent.toFixed(0)}%
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={
                          order.pnl >= 0 ? "text-green-500" : "text-red-500"
                        }
                      >
                        {formatCurrency(order.pnl)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(order.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

