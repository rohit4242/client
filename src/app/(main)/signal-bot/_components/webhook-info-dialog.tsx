"use client";

import { useState } from "react";
import { Copy, Check, ExternalLink, Info, Webhook, Shield, Target } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SignalBot } from "@/types/signal-bot";

interface WebhookInfoDialogProps {
  bot: SignalBot;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WebhookInfoDialog({ bot, open, onOpenChange }: WebhookInfoDialogProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/api/webhook/signal-bot`;
  
  const samplePayload = {
    botId: bot.id,
    secret: bot.webhookSecret,
    action: "ENTER_LONG",
    symbol: bot.symbols[0] || "BTCUSDT",
    price: 45000,
  };

  const tradingViewAlertMessage = `{
  "botId": "${bot.id}",
  "secret": "${bot.webhookSecret}",
  "action": "{{strategy.order.action}}",
  "symbol": "${bot.symbols[0] || 'BTCUSDT'}",
  "price": {{close}}
}`;

  const customMessageExample = bot.enterLongMsg ? `{
  "botId": "${bot.id}",
  "secret": "${bot.webhookSecret}",
  "action": "${bot.enterLongMsg}",
  "symbol": "${bot.symbols[0] || 'BTCUSDT'}",
  "price": {{close}}
}` : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Webhook className="h-5 w-5" />
            <span>Webhook Configuration</span>
          </DialogTitle>
          <DialogDescription>
            Set up TradingView alerts to send trading signals to your simplified bot.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Bot Info Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{bot.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Symbol:</span>
                    <span className="font-medium">{bot.symbols.join(', ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Portfolio:</span>
                    <span className="font-medium">{bot.portfolioPercent}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Order Type:</span>
                    <span className="font-medium">{bot.orderType}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant={bot.isActive ? "default" : "secondary"}>
                      {bot.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  {bot.stopLoss && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Stop Loss:</span>
                      <span className="font-medium text-red-600">{bot.stopLoss}%</span>
                    </div>
                  )}
                  {bot.takeProfit && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Take Profit:</span>
                      <span className="font-medium text-green-600">{bot.takeProfit}%</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Webhook Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-4 w-4" />
                <span>Webhook Credentials</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Webhook URL */}
              <div className="space-y-2">
                <Label htmlFor="webhook-url">Webhook URL</Label>
                <div className="flex space-x-2">
                  <Input
                    id="webhook-url"
                    value={webhookUrl}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(webhookUrl, 'url')}
                  >
                    {copiedField === 'url' ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Use this URL in your TradingView alert webhook configuration.
                </p>
              </div>

              {/* Bot ID */}
              <div className="space-y-2">
                <Label htmlFor="bot-id">Bot ID</Label>
                <div className="flex space-x-2">
                  <Input
                    id="bot-id"
                    value={bot.id}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(bot.id, 'botId')}
                  >
                    {copiedField === 'botId' ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Webhook Secret */}
              <div className="space-y-2">
                <Label htmlFor="webhook-secret">Webhook Secret</Label>
                <div className="flex space-x-2">
                  <Input
                    id="webhook-secret"
                    value={bot.webhookSecret || "Not configured"}
                    readOnly
                    className="font-mono text-sm"
                    type="password"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(bot.webhookSecret || "", 'secret')}
                    disabled={!bot.webhookSecret}
                  >
                    {copiedField === 'secret' ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Include this secret in your webhook payload for security.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* TradingView Alert Setup */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Target className="h-4 w-4" />
                  <span>TradingView Alert Setup</span>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <a
                    href="https://www.tradingview.com/support/solutions/43000529348-about-webhooks/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                    <span className="text-xs">TradingView Guide</span>
                  </a>
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Copy the message template below and paste it into your TradingView alert&apos;s message field. 
                  Make sure to set the webhook URL in the alert&apos;s notifications tab.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Standard Alert Message Template</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(tradingViewAlertMessage, 'template')}
                  >
                    {copiedField === 'template' ? (
                      <Check className="h-4 w-4 mr-2" />
                    ) : (
                      <Copy className="h-4 w-4 mr-2" />
                    )}
                    Copy Template
                  </Button>
                </div>
                <div className="bg-muted p-4 rounded-lg">
                  <pre className="text-sm font-mono whitespace-pre-wrap overflow-x-auto">
                    {tradingViewAlertMessage}
                  </pre>
                </div>
              </div>

              {/* Custom Message Template */}
              {customMessageExample && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Custom Message Template</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(customMessageExample, 'customTemplate')}
                    >
                      {copiedField === 'customTemplate' ? (
                        <Check className="h-4 w-4 mr-2" />
                      ) : (
                        <Copy className="h-4 w-4 mr-2" />
                      )}
                      Copy Custom
                    </Button>
                  </div>
                  <div className="bg-muted p-4 rounded-lg">
                    <pre className="text-sm font-mono whitespace-pre-wrap overflow-x-auto">
                      {customMessageExample}
                    </pre>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Supported Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Supported Signal Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Standard Actions</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center p-2 bg-green-50 dark:bg-green-950 rounded">
                      <span className="font-mono">ENTER_LONG</span>
                      <span className="text-muted-foreground">or BUY, LONG</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-red-50 dark:bg-red-950 rounded">
                      <span className="font-mono">EXIT_LONG</span>
                      <span className="text-muted-foreground">or SELL</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-orange-50 dark:bg-orange-950 rounded">
                      <span className="font-mono">ENTER_SHORT</span>
                      <span className="text-muted-foreground">or SHORT</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-blue-50 dark:bg-blue-950 rounded">
                      <span className="font-mono">EXIT_SHORT</span>
                      <span className="text-muted-foreground">or COVER</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Custom Messages</h4>
                  <div className="space-y-2 text-sm">
                    {bot.enterLongMsg && (
                      <div className="flex justify-between items-center p-2 bg-green-50 dark:bg-green-950 rounded">
                        <span className="font-mono">{bot.enterLongMsg}</span>
                        <span className="text-muted-foreground">Enter Long</span>
                      </div>
                    )}
                    {bot.exitLongMsg && (
                      <div className="flex justify-between items-center p-2 bg-red-50 dark:bg-red-950 rounded">
                        <span className="font-mono">{bot.exitLongMsg}</span>
                        <span className="text-muted-foreground">Exit Long</span>
                      </div>
                    )}
                    {bot.enterShortMsg && (
                      <div className="flex justify-between items-center p-2 bg-orange-50 dark:bg-orange-950 rounded">
                        <span className="font-mono">{bot.enterShortMsg}</span>
                        <span className="text-muted-foreground">Enter Short</span>
                      </div>
                    )}
                    {bot.exitShortMsg && (
                      <div className="flex justify-between items-center p-2 bg-blue-50 dark:bg-blue-950 rounded">
                        <span className="font-mono">{bot.exitShortMsg}</span>
                        <span className="text-muted-foreground">Exit Short</span>
                      </div>
                    )}
                    {!bot.enterLongMsg && !bot.exitLongMsg && !bot.enterShortMsg && !bot.exitShortMsg && (
                      <p className="text-muted-foreground italic text-center py-4">
                        No custom messages configured. Using standard actions only.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sample Payload */}
          <Card>
            <CardHeader>
              <CardTitle>Sample Webhook Payload</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-4 rounded-lg">
                <pre className="text-sm font-mono whitespace-pre-wrap overflow-x-auto">
                  {JSON.stringify(samplePayload, null, 2)}
                </pre>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                This is what your TradingView alert will send to the webhook endpoint.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end">
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}