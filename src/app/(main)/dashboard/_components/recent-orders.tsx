"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { generateMockOrders, formatCurrency, MockOrder } from "@/lib/mock-data";
import { ArrowUpRight, ArrowDownRight, Clock, CheckCircle, XCircle } from "lucide-react";
import { useMemo } from "react";

function getStatusIcon(status: MockOrder['status']) {
  switch (status) {
    case 'FILLED':
      return <CheckCircle className="h-3 w-3" />;
    case 'PENDING':
      return <Clock className="h-3 w-3" />;
    case 'CANCELED':
      return <XCircle className="h-3 w-3" />;
    default:
      return <Clock className="h-3 w-3" />;
  }
}

function getStatusColor(status: MockOrder['status']) {
  switch (status) {
    case 'FILLED':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'CANCELED':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

function getSideIcon(side: MockOrder['side']) {
  return side === 'BUY' ? (
    <ArrowUpRight className="h-3 w-3 text-green-600" />
  ) : (
    <ArrowDownRight className="h-3 w-3 text-red-600" />
  );
}

function getSideColor(side: MockOrder['side']) {
  return side === 'BUY' 
    ? 'bg-green-100 text-green-800 border-green-200'
    : 'bg-red-100 text-red-800 border-red-200';
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return `${diffInSeconds}s ago`;
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d ago`;
}

export function RecentOrders() {
  const orders = useMemo(() => generateMockOrders(), []);

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="flex-shrink-0">
        <CardTitle>Recent Orders</CardTitle>
        <CardDescription>
          Your latest 10 trading orders across all exchanges
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto space-y-3 pr-2" style={{ maxHeight: '400px' }}>
          {orders.map((order) => (
            <div
              key={order.id}
              className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  {getSideIcon(order.side)}
                  <Badge variant="outline" className={`text-xs ${getSideColor(order.side)}`}>
                    {order.side}
                  </Badge>
                </div>
                
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{order.symbol}</span>
                    <Badge variant="outline" className="text-xs">
                      {order.type}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{order.quantity} @ {formatCurrency(order.price)}</span>
                    <span>•</span>
                    <span>{formatTimeAgo(order.createdAt)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="font-medium text-sm">
                    {formatCurrency(order.value)}
                  </div>
                  <div className="flex items-center gap-1 justify-end">
                    {getStatusIcon(order.status)}
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getStatusColor(order.status)}`}
                    >
                      {order.status}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {orders.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No recent orders found</p>
            <p className="text-xs">Your trading orders will appear here</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
