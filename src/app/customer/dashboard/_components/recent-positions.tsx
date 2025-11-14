import { RecentPosition } from "@/db/actions/customer/get-recent-positions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Clock, Activity } from "lucide-react";
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
        return "bg-green-50 text-green-700 border-green-200";
      case "CLOSED":
        return "bg-slate-50 text-slate-700 border-slate-200";
      case "CANCELED":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  return (
    <Card className="border-slate-200 shadow-md rounded-xl">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <Activity className="h-5 w-5 text-teal-600" />
            Recent Trades
          </CardTitle>
        </div>
        {positions.length > 0 && (
          <Link
            href="/customer/positions"
            className="text-sm text-teal-600 hover:text-teal-700 font-medium transition-colors"
          >
            View all →
          </Link>
        )}
      </CardHeader>
      <CardContent className="overflow-x-auto">
        {positions.length === 0 ? (
          <div className="text-center py-12">
            <Activity className="h-12 w-12 mx-auto text-slate-400 mb-4 opacity-20" />
            <p className="text-sm font-medium text-slate-600">No trades yet</p>
            <p className="text-xs text-slate-500 mt-1">
              Your trades will appear here when they are created
            </p>
          </div>
        ) : (
          <div className="space-y-3 min-w-[700px]">
            {positions.map((position) => (
              <div
                key={position.id}
                className="flex items-center justify-between p-4 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex items-center gap-2">
                    {position.side === "LONG" ? (
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    ) : (
                      <TrendingDown className="h-5 w-5 text-red-600" />
                    )}
                    <div>
                      <p className="font-semibold text-slate-900">{position.symbol}</p>
                      <p className="text-sm text-slate-600">
                        {position.type} • {position.source}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm text-slate-600">Entry</p>
                    <p className="font-medium text-slate-900">{formatCurrency(position.entryPrice)}</p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm text-slate-600">Qty</p>
                    <p className="font-medium text-slate-900">{position.quantity}</p>
                  </div>

                  <div className="text-right min-w-[100px]">
                    <p className="text-sm text-slate-600">P&L</p>
                    <p
                      className={`font-bold ${
                        position.pnl >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {formatCurrency(position.pnl)}
                      <span className="text-xs ml-1">
                        ({position.pnlPercent >= 0 ? "+" : ""}
                        {position.pnlPercent.toFixed(2)}%)
                      </span>
                    </p>
                  </div>

                  <Badge className={`${getStatusColor(position.status)} border font-medium`}>
                    {position.status}
                  </Badge>

                  <div className="flex items-center gap-1 text-xs text-slate-500">
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

