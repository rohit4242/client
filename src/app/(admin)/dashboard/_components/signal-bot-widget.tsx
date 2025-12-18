"use client";

import { Bot, TrendingUp, Activity, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useBotsQuery, type BotWithExchange } from "@/features/signal-bot";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";

export function SignalBotWidget() {
  const {
    data: botsData,
    isLoading,
    error,
  } = useBotsQuery({
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const signalBots = botsData?.bots || [];

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Signal Bots</CardTitle>
          <Bot className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-8 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Signal Bots</CardTitle>
          <AlertCircle className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Failed to load signal bots</p>
        </CardContent>
      </Card>
    );
  }

  if (signalBots.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Signal Bots</CardTitle>
          <Bot className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            No signal bots configured yet.
          </p>
          <Button asChild size="sm" className="w-full">
            <Link href="/signal-bot">Create Your First Bot</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const activeBots = signalBots.filter(bot => bot.isActive);
  const totalTrades = signalBots.reduce((sum, bot) => sum + bot.totalTrades, 0);
  const totalPnl = signalBots.reduce((sum, bot) => sum + bot.totalPnl, 0);

  // Get top performing bot
  const topBot = signalBots.reduce((best, bot) =>
    bot.totalPnl > (best?.totalPnl || -Infinity) ? bot : best,
    signalBots[0]
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Signal Bots</CardTitle>
        <Bot className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-lg font-bold">{signalBots.length}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
          <div>
            <div className="text-lg font-bold text-green-600">{activeBots.length}</div>
            <div className="text-xs text-muted-foreground">Active</div>
          </div>
          <div>
            <div className="text-lg font-bold">{totalTrades}</div>
            <div className="text-xs text-muted-foreground">Trades</div>
          </div>
        </div>

        {/* Total P&L */}
        <div className="text-center">
          <div className={`text-xl font-bold ${totalPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(totalPnl)}
          </div>
          <div className="text-xs text-muted-foreground">Total P&L</div>
        </div>

        {/* Top Bot */}
        {topBot && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground">Top Performer</div>
            <div className="flex items-center justify-between p-2 bg-muted rounded">
              <div className="flex items-center space-x-2">
                <Badge variant={topBot.isActive ? "default" : "secondary"} className="text-xs">
                  {topBot.isActive ? "Active" : "Inactive"}
                </Badge>
                <span className="text-sm font-medium">{topBot.name}</span>
              </div>
              <div className="flex items-center space-x-1">
                <TrendingUp className="h-3 w-3 text-green-600" />
                <span className={`text-xs font-medium ${topBot.totalPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(topBot.totalPnl)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Active Bots List */}
        {activeBots.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground">
              Active Bots ({activeBots.length})
            </div>
            <div className="space-y-1">
              {activeBots.slice(0, 3).map((bot) => (
                <div key={bot.id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>{bot.name}</span>
                    <span className="text-muted-foreground">{bot.symbols.join(', ')}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Activity className="h-3 w-3" />
                    <span>{bot.totalTrades}</span>
                  </div>
                </div>
              ))}
              {activeBots.length > 3 && (
                <div className="text-xs text-muted-foreground text-center">
                  +{activeBots.length - 3} more active bots
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Button */}
        <Button asChild size="sm" variant="outline" className="w-full">
          <Link href="/signal-bot">Manage Bots</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
