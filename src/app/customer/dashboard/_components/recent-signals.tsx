import { RecentSignal } from "@/db/actions/customer/get-recent-signals";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, CheckCircle2, XCircle, Clock } from "lucide-react";

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
        return "bg-green-500/10 text-green-500";
      case "EXIT_LONG":
        return "bg-green-500/10 text-green-700";
      case "ENTER_SHORT":
        return "bg-red-500/10 text-red-500";
      case "EXIT_SHORT":
        return "bg-red-500/10 text-red-700";
      default:
        return "bg-gray-500/10 text-gray-500";
    }
  };

  const getActionLabel = (action: string) => {
    return action.replace(/_/g, " ");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <Bot className="h-5 w-5" />
          Recent Signals
        </CardTitle>
      </CardHeader>
      <CardContent>
        {signals.length === 0 ? (
          <div className="text-center py-8">
            <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No signals yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Bot signals will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {signals.map((signal) => (
              <div
                key={signal.id}
                className="p-3 rounded-lg border bg-card space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className={getActionColor(signal.action)}>
                      {getActionLabel(signal.action)}
                    </Badge>
                    <span className="font-semibold">{signal.symbol}</span>
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
                  <span className="text-muted-foreground">{signal.botName}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(signal.createdAt)}
                  </span>
                </div>

                {signal.price && (
                  <p className="text-sm text-muted-foreground">
                    Price: ${signal.price.toFixed(2)}
                  </p>
                )}

                {signal.message && (
                  <p className="text-sm text-muted-foreground italic">
                    {signal.message}
                  </p>
                )}

                {signal.error && (
                  <p className="text-sm text-red-500">Error: {signal.error}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

