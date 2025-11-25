"use client";

import { useState } from "react";
import { 
  Bot, 
  Settings, 
  Trash2, 
  Link,
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign,
  Shield,
  Target
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { SignalBot } from "@/types/signal-bot";
import { EditSignalBotDialog } from "./dialogs/edit-bot-dialog";
import { DeleteSignalBotDialog } from "./dialogs/delete-bot-dialog";
import { WebhookInfoDialog } from "./dialogs/webhook-info-dialog";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { toast } from "sonner";

interface SignalBotCardProps {
  bot: SignalBot;
  onBotUpdated: () => void;
}

export function SignalBotCard({ bot, onBotUpdated }: SignalBotCardProps) {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showWebhookDialog, setShowWebhookDialog] = useState(false);

  const toggleBotMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.patch(`/api/signal-bots/${bot.id}`, {
        action: "toggle",
      });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data.message);
      onBotUpdated();
    },
    onError: (error: AxiosError<{ error: string }>) => {
      toast.error(error.response?.data?.error || "Failed to toggle bot");
    },
  });

  const winRate = bot.totalTrades > 0 
    ? (bot.winTrades / bot.totalTrades) * 100 
    : 0;

  return (
    <>
      <Card className={`${bot.isActive ? 'border-green-200 dark:border-green-800' : 'border-gray-200 dark:border-gray-800'} transition-colors hover:shadow-md`}>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`rounded-full p-2 ${bot.isActive ? 'bg-green-100 dark:bg-green-900' : 'bg-gray-100 dark:bg-gray-800'}`}>
                <Bot className={`h-5 w-5 ${bot.isActive ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`} />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{bot.name}</h3>
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mt-1">
                  {bot.symbols.map(symbol => (
                    <Badge key={symbol} variant="outline" className="text-xs">{symbol}</Badge>
                  ))}
                  <span className="text-xs">•</span>
                  <span>{bot.portfolioPercent}%</span>
                  {bot.leverage && bot.leverage > 1 && (
                    <>
                      <span className="text-xs">•</span>
                      <Badge variant="secondary" className="text-xs">{bot.leverage}x</Badge>
                    </>
                  )}
                  {bot.accountType === "MARGIN" && (
                    <>
                      <span className="text-xs">•</span>
                      <Badge variant="outline" className="text-xs border-orange-500 text-orange-700 dark:text-orange-400">
                        {bot.marginType || 'CROSS'}
                      </Badge>
                      {bot.autoRepay && (
                        <Badge variant="outline" className="text-xs border-green-500 text-green-700 dark:text-green-400">
                          Auto Repay
                        </Badge>
                      )}
                    </>
                  )}
                </div>
                {bot.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {bot.description}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Badge variant={bot.isActive ? "default" : "secondary"}>
                {bot.isActive ? "Active" : "Inactive"}
              </Badge>
              <Badge 
                variant="outline" 
                className={bot.accountType === "MARGIN" ? "border-orange-500 text-orange-700 dark:text-orange-400" : "border-blue-500 text-blue-700 dark:text-blue-400"}
              >
                {bot.accountType === "MARGIN" ? "Margin" : "Spot"}
              </Badge>
              
              <Switch
                checked={bot.isActive}
                onCheckedChange={() => toggleBotMutation.mutate()}
                disabled={toggleBotMutation.isPending}
              />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                    <Settings className="h-4 w-4 mr-2" />
                    Edit Bot
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowWebhookDialog(true)}>
                    <Link className="h-4 w-4 mr-2" />
                    Webhook & Alerts
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Bot
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            {/* Total Trades */}
            <div className="flex flex-col space-y-1 p-3 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between">
                <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <p className="text-lg font-bold text-blue-900 dark:text-blue-100">{bot.totalTrades}</p>
              </div>
              <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">Total Trades</p>
              {bot.winTrades > 0 && (
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  {bot.winTrades}W / {bot.lossTrades || 0}L
                </p>
              )}
            </div>

            {/* Win Rate */}
            <div className="flex flex-col space-y-1 p-3 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
              <div className="flex items-center justify-between">
                <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                <p className="text-lg font-bold text-green-900 dark:text-green-100">{winRate.toFixed(1)}%</p>
              </div>
              <p className="text-xs text-green-700 dark:text-green-300 font-medium">Win Rate</p>
              {bot.totalVolume > 0 && (
                <p className="text-xs text-green-600 dark:text-green-400">
                  ${bot.totalVolume.toFixed(0)} vol
                </p>
              )}
            </div>

            {/* Total P&L */}
            <div className={`flex flex-col space-y-1 p-3 rounded-lg border ${
              bot.totalPnl >= 0 
                ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800' 
                : 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'
            }`}>
              <div className="flex items-center justify-between">
                <DollarSign className={`h-4 w-4 ${
                  bot.totalPnl >= 0 
                    ? 'text-emerald-600 dark:text-emerald-400' 
                    : 'text-red-600 dark:text-red-400'
                }`} />
                <p className={`text-lg font-bold ${
                  bot.totalPnl >= 0 
                    ? 'text-emerald-900 dark:text-emerald-100' 
                    : 'text-red-900 dark:text-red-100'
                }`}>
                  {formatCurrency(bot.totalPnl)}
                </p>
              </div>
              <p className={`text-xs font-medium ${
                bot.totalPnl >= 0 
                  ? 'text-emerald-700 dark:text-emerald-300' 
                  : 'text-red-700 dark:text-red-300'
              }`}>Total P&L</p>
              {bot.accountType === "MARGIN" && bot.totalInterest > 0 && (
                <p className="text-xs text-orange-600 dark:text-orange-400">
                  ${bot.totalInterest.toFixed(2)} interest
                </p>
              )}
            </div>

            {/* Risk Management */}
            <div className="flex flex-col space-y-1 p-3 rounded-lg bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800">
              <div className="flex items-center justify-between">
                <Shield className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                <p className="text-lg font-bold text-orange-900 dark:text-orange-100">
                  {bot.stopLoss ? `${bot.stopLoss}%` : '-'}
                </p>
              </div>
              <p className="text-xs text-orange-700 dark:text-orange-300 font-medium">Stop Loss</p>
              {bot.takeProfit && (
                <p className="text-xs text-orange-600 dark:text-orange-400">
                  TP: {bot.takeProfit}%
                </p>
              )}
            </div>
          </div>

          {/* Trading Configuration */}
          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center flex-wrap gap-3">
                <Badge variant="outline" className="text-xs">
                  {bot.orderType} Orders
                </Badge>
                {bot.stopLoss && (
                  <div className="flex items-center space-x-1 text-red-600 dark:text-red-400">
                    <TrendingDown className="h-3 w-3" />
                    <span className="text-xs">SL: {bot.stopLoss}%</span>
                  </div>
                )}
                {bot.takeProfit && (
                  <div className="flex items-center space-x-1 text-green-600 dark:text-green-400">
                    <Target className="h-3 w-3" />
                    <span className="text-xs">TP: {bot.takeProfit}%</span>
                  </div>
                )}
                {bot.accountType === "MARGIN" && (
                  <div className="flex items-center space-x-1 text-orange-600 dark:text-orange-400">
                    <Shield className="h-3 w-3" />
                    <span className="text-xs">Max Borrow: {bot.maxBorrowPercent}%</span>
                  </div>
                )}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowWebhookDialog(true)}
                className="text-xs"
              >
                <Link className="h-3 w-3 mr-1" />
                Webhook
              </Button>
            </div>
          </div>

          {/* Footer Info */}
          <div className="mt-4 pt-4 border-t flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center space-x-4">
              <span className="flex items-center space-x-1">
                <Bot className="h-3 w-3" />
                <span>Simple Signal Bot</span>
              </span>
            </div>
            <span>Created {formatDate(new Date(bot.createdAt))}</span>
          </div>
        </CardContent>
      </Card>

      <EditSignalBotDialog
        bot={bot}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onSuccess={() => {
          setShowEditDialog(false);
          onBotUpdated();
        }}
      />

      <DeleteSignalBotDialog
        bot={bot}
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onSuccess={() => {
          setShowDeleteDialog(false);
          onBotUpdated();
        }}
      />

      <WebhookInfoDialog
        bot={bot}
        open={showWebhookDialog}
        onOpenChange={setShowWebhookDialog}
      />

    </>
  );
}