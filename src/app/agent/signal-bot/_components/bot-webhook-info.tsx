"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Copy, 
  Globe, 
  Key, 
  Settings, 
  BarChart3,
  Eye,
  EyeOff
} from "lucide-react";

import { SignalBot } from "@/types/signal-bot";

interface BotWebhookInfoProps {
  bot: SignalBot;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BotWebhookInfo({ bot, open, onOpenChange }: BotWebhookInfoProps) {
  const [showSecret, setShowSecret] = useState(false);

  const { data: webhookInfo, isLoading } = useQuery({
    queryKey: ["webhook-info", bot.id],
    queryFn: async () => {
      const response = await axios.get(`/api/webhook/signal-bot?botId=${bot.id}`);
      return response.data;
    },
    enabled: open,
  });

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard!`);
    } catch {
      toast.error(`Failed to copy ${label}`);
    }
  };

  const webhookPayload = webhookInfo?.formats?.json?.example 
    ? JSON.stringify(webhookInfo?.formats?.json?.example, null, 2)
    : "";

  console.log("webhookPayload", webhookPayload);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Globe className="h-5 w-5" />
            <span>Webhook Configuration</span>
          </DialogTitle>
          <DialogDescription>
            Setup instructions and webhook details for &quot;{bot.name}&quot;
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Bot Status */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center space-x-2">
                    <Settings className="h-5 w-5" />
                    <span>Bot Status</span>
                  </span>
                  <Badge variant={bot.isActive ? "default" : "secondary"}>
                    {bot.isActive ? "Active" : "Inactive"}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Name:</span>
                    <span className="ml-2 font-medium">{bot.name}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Symbols:</span>
                    <span className="ml-2">{bot.symbols.join(', ')}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Trade Amount:</span>
                    <span className="ml-2 font-medium">
                      {bot.tradeAmountType === "QUOTE" 
                        ? `$${bot.tradeAmount?.toFixed(2) || 0}`
                        : `${bot.tradeAmount?.toFixed(6) || 0}`}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Order Type:</span>
                    <span className="ml-2">{bot.orderType}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Webhook Configuration */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2">
                  <Globe className="h-5 w-5" />
                  <span>Webhook Endpoint</span>
                </CardTitle>
                <CardDescription>
                  Use this URL in your TradingView alerts to send signals to this bot
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Webhook URL</label>
                  <div className="flex items-center space-x-2">
                    <code className="flex-1 bg-muted p-3 rounded-md text-sm font-mono break-all">
                      {webhookInfo?.webhookEndpoint || bot.webhookUrl}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(
                        webhookInfo?.webhookEndpoint || bot.webhookUrl || "", 
                        "Webhook URL"
                      )}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center space-x-2">
                    <Key className="h-4 w-4" />
                    <span>Webhook Secret</span>
                  </label>
                  <div className="flex items-center space-x-2">
                    <code className="flex-1 bg-muted p-3 rounded-md text-sm font-mono">
                      {showSecret ? bot.webhookSecret : "••••••••••••••••••••••••••••••••"}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowSecret(!showSecret)}
                    >
                      {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(bot.webhookSecret || "", "Webhook Secret")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Include this secret in your webhook payload for security
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Payload Example */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>TradingView Alert Payload</CardTitle>
                <CardDescription>
                  Copy this JSON payload into your TradingView alert webhook message
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">JSON Payload</label>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(webhookPayload, "Webhook Payload")}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Payload
                    </Button>
                  </div>
                  <pre className="bg-muted p-4 rounded-md text-xs font-mono overflow-x-auto">
                    {webhookPayload}
                  </pre>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Signal Actions</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="space-y-1">
                      <p><strong>Long Entry:</strong> {"ENTER_LONG, BUY, LONG"}</p>
                      <p><strong>Long Exit:</strong> {"EXIT_LONG, SELL_LONG, CLOSE_LONG"}</p>
                    </div>
                    <div className="space-y-1">
                      <p><strong>Short Entry:</strong> {"ENTER_SHORT, SELL, SHORT"}</p>
                      <p><strong>Short Exit:</strong> {"EXIT_SHORT, BUY_SHORT, CLOSE_SHORT"}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Statistics */}
            {webhookInfo?.statistics && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5" />
                    <span>Bot Statistics</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold">{webhookInfo.statistics.totalSignals}</div>
                      <div className="text-xs text-muted-foreground">Total Signals</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{webhookInfo.statistics.totalTrades}</div>
                      <div className="text-xs text-muted-foreground">Total Trades</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">
                        ${webhookInfo.statistics.totalPnl.toFixed(2)}
                      </div>
                      <div className="text-xs text-muted-foreground">Total P&L</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">
                        {webhookInfo.statistics.winRate.toFixed(1)}%
                      </div>
                      <div className="text-xs text-muted-foreground">Win Rate</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Separator />

            {/* Setup Instructions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>TradingView Setup Instructions</CardTitle>
                <CardDescription>
                  Follow these steps to connect your TradingView alerts to this bot
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 text-sm">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">1</div>
                    <div>
                      <strong>Create Alert in TradingView</strong>
                      <p className="text-muted-foreground">Open your chart, right-click and select &quot;Add Alert&quot;</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">2</div>
                    <div>
                      <strong>Configure Webhook</strong>
                      <p className="text-muted-foreground">In the Notifications tab, check &quot;Webhook URL&quot; and paste the webhook URL above</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">3</div>
                    <div>
                      <strong>Set Message</strong>
                      <p className="text-muted-foreground">Copy the JSON payload above into the &quot;Message&quot; field</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">4</div>
                    <div>
                      <strong>Customize Action</strong>
                      <p className="text-muted-foreground">Replace &quot;ENTER_LONG&quot; in the payload with your desired signal action</p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                  <p className="text-sm text-blue-900 dark:text-blue-100">
                    <strong>💡 Pro Tip:</strong> You can use TradingView&apos;s placeholder variables like {`{{close}}`} for price, 
                    {` {{volume}}`} for volume, etc. in your webhook message to pass dynamic values.
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
