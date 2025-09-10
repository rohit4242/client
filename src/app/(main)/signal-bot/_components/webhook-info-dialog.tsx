"use client";

import { useState } from "react";
import { Copy, Check, ExternalLink, Info } from "lucide-react";
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
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
    action: "BUY",
    symbol: bot.symbol,
    price: 45000,
    strategy: "My Strategy",
    timeframe: bot.timeframe,
    botId: bot.id,
    secret: bot.webhookSecret,
  };

  const tradingViewAlertMessage = `{
  "action": "{{strategy.order.action}}",
  "symbol": "${bot.symbol}",
  "price": {{close}},
  "strategy": "{{strategy.order.comment}}",
  "timeframe": "${bot.timeframe}",
  "botId": "${bot.id}",
  "secret": "${bot.webhookSecret}"
}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Webhook Configuration</DialogTitle>
          <DialogDescription>
            Set up TradingView alerts to send signals to your bot.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Bot Info */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <h3 className="font-semibold">{bot.name}</h3>
              <p className="text-sm text-muted-foreground">{bot.symbol} • {bot.timeframe}</p>
            </div>
            <Badge variant={bot.isActive ? "default" : "secondary"}>
              {bot.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>

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

          <Separator />

          {/* TradingView Alert Configuration */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-semibold">TradingView Alert Setup</h3>
              <Button variant="ghost" size="sm" asChild>
                <a
                  href="https://www.tradingview.com/support/solutions/43000529348-about-webhooks/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1"
                >
                  <ExternalLink className="h-3 w-3" />
                  <span className="text-xs">Guide</span>
                </a>
              </Button>
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Copy the message template below and paste it into your TradingView alert&apos;s message field. 
                Make sure to set the webhook URL in the alert&apos;s notifications tab.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Alert Message Template</Label>
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
          </div>

          <Separator />

          {/* Sample Payload */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Sample Webhook Payload</h3>
            <div className="bg-muted p-4 rounded-lg">
              <pre className="text-sm font-mono whitespace-pre-wrap overflow-x-auto">
                {JSON.stringify(samplePayload, null, 2)}
              </pre>
            </div>
          </div>

          {/* Supported Actions */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Supported Actions</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">Standard Actions</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• BUY / ENTER_LONG</li>
                  <li>• SELL / EXIT_LONG</li>
                  <li>• SHORT / ENTER_SHORT</li>
                  <li>• COVER / EXIT_SHORT</li>
                  <li>• CLOSE / EXIT_ALL</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Custom Messages</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  {bot.enterLongMsg && <li>• {bot.enterLongMsg} (Enter Long)</li>}
                  {bot.exitLongMsg && <li>• {bot.exitLongMsg} (Exit Long)</li>}
                  {bot.enterShortMsg && <li>• {bot.enterShortMsg} (Enter Short)</li>}
                  {bot.exitShortMsg && <li>• {bot.exitShortMsg} (Exit Short)</li>}
                  {bot.exitAllMsg && <li>• {bot.exitAllMsg} (Exit All)</li>}
                  {!bot.enterLongMsg && !bot.exitLongMsg && !bot.enterShortMsg && !bot.exitShortMsg && !bot.exitAllMsg && (
                    <li className="italic">No custom messages configured</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
