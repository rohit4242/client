import { RecentSignal } from "@/db/actions/customer/get-recent-signals";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, CheckCircle2, XCircle, Clock } from "lucide-react";
import Link from "next/link";

interface RecentSignalsProps {
  signals: RecentSignal[];
}

export function RecentSignals({ signals }: RecentSignalsProps) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "ENTER_LONG":
        return "bg-green-500/10 text-green-600 border-green-200";
      case "EXIT_LONG":
        return "bg-green-500/10 text-green-700 border-green-300";
      case "ENTER_SHORT":
        return "bg-red-500/10 text-red-600 border-red-200";
      case "EXIT_SHORT":
        return "bg-red-500/10 text-red-700 border-red-300";
      default:
        return "bg-slate-500/10 text-slate-600 border-slate-200";
    }
  };

  const getActionLabel = (action: string) => {
    return action.replace(/_/g, " ");
  };

  return (
    <Card className="border-slate-200 shadow-md rounded-xl">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <Bot className="h-5 w-5 text-teal-600" />
            Recent Signals
          </CardTitle>
          <CardDescription className="mt-1">Bot signals will appear here</CardDescription>
        </div>
        {signals.length > 0 && (
          <Link
            href="/customer/signals"
            className="text-sm text-teal-600 hover:text-teal-700 font-medium transition-colors"
          >
            View all →
          </Link>
        )}
      </CardHeader>
      <CardContent>
        {signals.length === 0 ? (
          <div className="text-center py-12">
            <Bot className="h-12 w-12 mx-auto text-slate-400 mb-4 opacity-20" />
            <p className="text-sm font-medium text-slate-600">No signals yet</p>
            <p className="text-xs text-slate-500 mt-1">
              Bot signals will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {signals.map((signal) => (
              <div
                key={signal.id}
                className="p-4 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className={`${getActionColor(signal.action)} border font-medium`}>
                      {getActionLabel(signal.action)}
                    </Badge>
                    <span className="font-semibold text-slate-900">{signal.symbol}</span>
                  </div>
                  {signal.processed ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : signal.error ? (
                    <XCircle className="h-4 w-4 text-red-500" />
                  ) : (
                    <Clock className="h-4 w-4 text-yellow-500" />
                  )}
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 font-medium">{signal.botName}</span>
                  <span className="text-xs text-slate-500">
                    {formatDate(signal.createdAt)}
                  </span>
                </div>

                {signal.price && (
                  <p className="text-sm text-slate-600 font-medium">
                    Price: <span className="text-slate-900">${signal.price.toFixed(2)}</span>
                  </p>
                )}

                {signal.message && (
                  <p className="text-sm text-slate-600 italic">
                    {signal.message}
                  </p>
                )}

                {signal.error && (
                  <p className="text-sm text-red-600 font-medium">Error: {signal.error}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

