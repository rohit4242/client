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
  Eye,
  EyeOff,
  Code2,
  CheckCircle2
} from "lucide-react";

import { SignalBot } from "@/types/signal-bot";

interface WebhookInfoDialogProps {
  bot: SignalBot;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WebhookInfoDialog({ bot, open, onOpenChange }: WebhookInfoDialogProps) {
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
      toast.success(`${label} copied!`);
    } catch {
      toast.error(`Failed to copy ${label}`);
    }
  };

  const examplePayload = webhookInfo?.testingInfo?.examplePayload 
    ? JSON.stringify(webhookInfo.testingInfo.examplePayload, null, 2)
    : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Globe className="h-5 w-5" />
            <span>Webhook Setup - {bot.name}</span>
          </DialogTitle>
          <DialogDescription>
            Send trading signals from TradingView or any platform using JSON
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Webhook URL */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Webhook URL</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2">
                  <code className="flex-1 bg-muted p-2 rounded text-xs font-mono break-all">
                    {webhookInfo?.webhookEndpoint}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(webhookInfo?.webhookEndpoint || "", "URL")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center space-x-2">
                    <Key className="h-3 w-3" />
                    <span>Secret Key</span>
                  </label>
                  <div className="flex items-center space-x-2">
                    <code className="flex-1 bg-muted p-2 rounded text-xs font-mono">
                      {showSecret ? bot.webhookSecret : "••••••••••••••••••••"}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowSecret(!showSecret)}
                    >
                      {showSecret ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(bot.webhookSecret || "", "Secret")}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* JSON Payload */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center space-x-2">
                  <Code2 className="h-4 w-4" />
                  <span>JSON Payload Format</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Copy this payload and paste it in your TradingView alert message or API request
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(examplePayload, "Payload")}
                    className="text-xs"
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy JSON
                  </Button>
                </div>
                <pre className="bg-muted p-3 rounded text-xs font-mono overflow-x-auto">
                  {examplePayload}
                </pre>

                <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded text-xs space-y-2">
                  <p className="font-medium text-blue-900 dark:text-blue-100">📝 Actions you can use:</p>
                  <div className="grid grid-cols-2 gap-2 text-blue-700 dark:text-blue-300">
                    <div className="flex items-center space-x-1">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>ENTER_LONG, BUY, LONG</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>EXIT_LONG, SELL</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>ENTER_SHORT, SHORT</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>EXIT_SHORT, COVER</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* TradingView Setup */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">TradingView Setup</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-start space-x-2">
                    <div className="w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">1</div>
                    <p className="text-sm">Create alert in TradingView, check &quot;Webhook URL&quot;</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">2</div>
                    <p className="text-sm">Paste the webhook URL above</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">3</div>
                    <p className="text-sm">Copy the JSON payload above into the &quot;Message&quot; field</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">4</div>
                    <p className="text-sm">Change &quot;action&quot; to match your signal (ENTER_LONG, EXIT_LONG, etc.)</p>
                  </div>
                </div>

                <Separator />

                <div className="bg-amber-50 dark:bg-amber-950 p-3 rounded text-xs">
                  <p className="text-amber-900 dark:text-amber-100">
                    <strong>💡 TradingView Tip:</strong> Use {`{{close}}`} for price, {`{{ticker}}`} for symbol
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Bot Config Summary */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Bot Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-muted-foreground">Account:</span>
                    <div className="mt-1 flex items-center space-x-1">
                      <Badge variant={bot.accountType === "MARGIN" ? "destructive" : "secondary"} className="text-xs">
                        {bot.accountType}
                      </Badge>
                      {bot.accountType === "MARGIN" && bot.marginType && (
                        <Badge variant="outline" className="text-xs">{bot.marginType}</Badge>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Symbols:</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {bot.symbols.map(symbol => (
                        <Badge key={symbol} variant="outline" className="text-xs">{symbol}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Position Size:</span>
                    <p className="font-medium">{bot.portfolioPercent}%</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Leverage:</span>
                    <p className="font-medium">{bot.leverage}x</p>
                  </div>
                  {bot.stopLoss && (
                    <div>
                      <span className="text-muted-foreground">Stop Loss:</span>
                      <p className="font-medium text-red-600">{bot.stopLoss}%</p>
                    </div>
                  )}
                  {bot.takeProfit && (
                    <div>
                      <span className="text-muted-foreground">Take Profit:</span>
                      <p className="font-medium text-green-600">{bot.takeProfit}%</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end pt-2">
              <Button onClick={() => onOpenChange(false)}>Close</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
