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
import { EditSignalBotDialog } from "./edit-signal-bot-dialog";
import { DeleteSignalBotDialog } from "./delete-signal-bot-dialog";
import { WebhookInfoDialog } from "./webhook-info-dialog";
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
    ? (bot.winningTrades / bot.totalTrades) * 100 
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
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <span>{bot.symbols.join(', ')}</span>
                  <span>•</span>
                  <span>{bot.portfolioPercent}% portfolio</span>
                  {bot.leverage && bot.leverage > 1 && (
                    <>
                      <span>•</span>
                      <span>{bot.leverage}x leverage</span>
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
                    Webhook Info
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
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* Total Trades */}
            <div className="flex items-center space-x-3">
              <div className="rounded-full bg-blue-100 dark:bg-blue-900 p-2">
                <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium">{bot.totalTrades}</p>
                <p className="text-xs text-muted-foreground">Total Trades</p>
              </div>
            </div>

            {/* Win Rate */}
            <div className="flex items-center space-x-3">
              <div className="rounded-full bg-green-100 dark:bg-green-900 p-2">
                <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium">{winRate.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">Win Rate</p>
              </div>
            </div>

            {/* Total P&L */}
            <div className="flex items-center space-x-3">
              <div className={`rounded-full p-2 ${
                bot.totalPnl >= 0 
                  ? 'bg-green-100 dark:bg-green-900' 
                  : 'bg-red-100 dark:bg-red-900'
              }`}>
                <DollarSign className={`h-4 w-4 ${
                  bot.totalPnl >= 0 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-red-600 dark:text-red-400'
                }`} />
              </div>
              <div>
                <p className={`text-sm font-medium ${
                  bot.totalPnl >= 0 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {formatCurrency(bot.totalPnl)}
                </p>
                <p className="text-xs text-muted-foreground">Total P&L</p>
              </div>
            </div>

            {/* Risk Management */}
            <div className="flex items-center space-x-3">
              <div className="rounded-full bg-orange-100 dark:bg-orange-900 p-2">
                <Shield className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm font-medium">
                  {bot.stopLoss ? `${bot.stopLoss}%` : 'None'}
                </p>
                <p className="text-xs text-muted-foreground">Stop Loss</p>
              </div>
            </div>
          </div>

          {/* Risk Management Details */}
          {(bot.stopLoss || bot.takeProfit) && (
            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-4">
                  {bot.stopLoss && (
                    <div className="flex items-center space-x-1 text-red-600 dark:text-red-400">
                      <TrendingDown className="h-3 w-3" />
                      <span>SL: {bot.stopLoss}%</span>
                    </div>
                  )}
                  {bot.takeProfit && (
                    <div className="flex items-center space-x-1 text-green-600 dark:text-green-400">
                      <Target className="h-3 w-3" />
                      <span>TP: {bot.takeProfit}%</span>
                    </div>
                  )}
                </div>
                <Badge variant="outline" className="text-xs">
                  {bot.orderType} Orders
                </Badge>
              </div>
            </div>
          )}

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