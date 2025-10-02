import { RecentPosition } from "@/db/actions/customer/get-recent-positions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Clock } from "lucide-react";
import Link from "next/link";

interface RecentPositionsProps {
  positions: RecentPosition[];
}

export function RecentPositions({ positions }: RecentPositionsProps) {
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

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl">Recent Trades</CardTitle>
        <Link
          href="/customer/positions"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          View all →
        </Link>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        {positions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No trades yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Your trades will appear here when they are created
            </p>
          </div>
        ) : (
          <div className="space-y-4 min-w-[700px]">
            {positions.map((position) => (
              <div
                key={position.id}
                className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex items-center gap-2">
                    {position.side === "LONG" ? (
                      <TrendingUp className="h-5 w-5 text-green-500" />
                    ) : (
                      <TrendingDown className="h-5 w-5 text-red-500" />
                    )}
                    <div>
                      <p className="font-semibold">{position.symbol}</p>
                      <p className="text-sm text-muted-foreground">
                        {position.type} • {position.source}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Entry</p>
                    <p className="font-medium">{formatCurrency(position.entryPrice)}</p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Qty</p>
                    <p className="font-medium">{position.quantity}</p>
                  </div>

                  <div className="text-right min-w-[100px]">
                    <p className="text-sm text-muted-foreground">P&L</p>
                    <p
                      className={`font-bold ${
                        position.pnl >= 0 ? "text-green-500" : "text-red-500"
                      }`}
                    >
                      {formatCurrency(position.pnl)}
                      <span className="text-xs ml-1">
                        ({position.pnlPercent >= 0 ? "+" : ""}
                        {position.pnlPercent.toFixed(2)}%)
                      </span>
                    </p>
                  </div>

                  <Badge variant={getStatusColor(position.status)}>
                    {position.status}
                  </Badge>

                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {formatDate(position.createdAt)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

