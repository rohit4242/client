"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Copy, Check, ExternalLink, Info, Webhook, Code, AlertCircle, TrendingUp, TrendingDown } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SignalBot } from "@/types/signal-bot";

interface WebhookInfoDialogProps {
  bot: SignalBot;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WebhookInfoDialog({ bot, open, onOpenChange }: WebhookInfoDialogProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const { data: webhookInfo, isLoading } = useQuery({
    queryKey: ["webhook-info", bot.id],
    queryFn: async () => {
      const response = await axios.get(`/api/webhook/signal-bot?botId=${bot.id}`);
      return response.data;
    },
    enabled: open,
  });

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const webhookUrl = webhookInfo?.webhookUrl || `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/api/webhook/signal-bot`;

  // Generate alert message examples
  const generateAlertMessage = (action: string, symbol: string = "{{ticker}}", timeframe: string = "{{interval}}") => {
    return `${action}_BINANCE_${symbol}_${bot.name}_${timeframe}_${bot.id}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Webhook className="h-5 w-5" />
            <span>Webhook Configuration</span>
          </DialogTitle>
          <DialogDescription>
            Set up TradingView alerts to send trading signals to &quot;{bot.name}&quot;
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
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
                      <span className="text-muted-foreground">Symbols:</span>
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
                  <Webhook className="h-4 w-4" />
                  <span>Webhook Endpoint</span>
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
                  <p className="text-sm text-muted-foreground">
                    This ID is included in your alert messages to identify this bot.
                  </p>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No webhook secret needed! The bot ID in the alert message identifies your bot securely.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* TradingView Alert Format */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Code className="h-4 w-4" />
                    <span>Alert Message Format</span>
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
                    Format: <code className="text-xs bg-muted px-1 py-0.5 rounded">ACTION_EXCHANGE_SYMBOL_BOTNAME_TIMEFRAME_BOTID</code>
                  </AlertDescription>
                </Alert>

                <Tabs defaultValue="simple" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="simple">Simple Examples</TabsTrigger>
                    <TabsTrigger value="pinescript">Pine Script</TabsTrigger>
                  </TabsList>

                  <TabsContent value="simple" className="space-y-4">
                    <div className="space-y-3">
                      {/* Enter Long */}
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <TrendingUp className="h-4 w-4 text-green-600" />
                          <Label className="text-sm font-medium">Enter Long</Label>
                        </div>
                        <div className="flex space-x-2">
                          <Input
                            value={generateAlertMessage("ENTER-LONG")}
                            readOnly
                            className="font-mono text-xs"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => copyToClipboard(generateAlertMessage("ENTER-LONG"), 'enterLong')}
                          >
                            {copiedField === 'enterLong' ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* Exit Long */}
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <TrendingDown className="h-4 w-4 text-red-600" />
                          <Label className="text-sm font-medium">Exit Long</Label>
                        </div>
                        <div className="flex space-x-2">
                          <Input
                            value={generateAlertMessage("EXIT-LONG")}
                            readOnly
                            className="font-mono text-xs"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => copyToClipboard(generateAlertMessage("EXIT-LONG"), 'exitLong')}
                          >
                            {copiedField === 'exitLong' ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* Enter Short */}
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <TrendingDown className="h-4 w-4 text-orange-600" />
                          <Label className="text-sm font-medium">Enter Short</Label>
                        </div>
                        <div className="flex space-x-2">
                          <Input
                            value={generateAlertMessage("ENTER-SHORT")}
                            readOnly
                            className="font-mono text-xs"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => copyToClipboard(generateAlertMessage("ENTER-SHORT"), 'enterShort')}
                          >
                            {copiedField === 'enterShort' ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* Exit Short */}
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <TrendingUp className="h-4 w-4 text-blue-600" />
                          <Label className="text-sm font-medium">Exit Short</Label>
                        </div>
                        <div className="flex space-x-2">
                          <Input
                            value={generateAlertMessage("EXIT-SHORT")}
                            readOnly
                            className="font-mono text-xs"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => copyToClipboard(generateAlertMessage("EXIT-SHORT"), 'exitShort')}
                          >
                            {copiedField === 'exitShort' ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-md text-sm">
                        <p className="text-blue-900 dark:text-blue-100">
                          <strong>📝 Note:</strong> <code className="bg-blue-100 dark:bg-blue-900 px-1 py-0.5 rounded">{"{{ticker}}"}</code> and <code className="bg-blue-100 dark:bg-blue-900 px-1 py-0.5 rounded">{"{{interval}}"}</code> are TradingView placeholders that get replaced with the actual symbol and timeframe.
                        </p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="pinescript" className="space-y-4">
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        Use this Pine Script function to generate alert messages automatically:
                      </p>

                      <div className="space-y-2">
                        <Label>Pine Script Helper Function</Label>
                        <div className="relative">
                          <pre className="bg-muted p-4 rounded-md text-xs font-mono overflow-x-auto">
{`//@version=5
strategy("Signal Bot", overlay=true)

// Your bot ID
BOT_ID = "${bot.id}"
BOT_NAME = "${bot.name}"

// Generate alert message
generateAlert(action) =>
    action + "_BINANCE_" + syminfo.ticker + 
    "_" + BOT_NAME + "_" + timeframe.period + 
    "_" + BOT_ID

// Example usage
if (longCondition)
    strategy.entry("Long", strategy.long, 
        alert_message=generateAlert("ENTER-LONG"))

if (ta.crossunder(fastMA, slowMA))
    strategy.close("Long", 
        alert_message=generateAlert("EXIT-LONG"))`}
                          </pre>
                          <Button
                            variant="outline"
                            size="sm"
                            className="absolute top-2 right-2"
                            onClick={() => copyToClipboard(
                              `//@version=5\nstrategy("Signal Bot", overlay=true)\n\nBOT_ID = "${bot.id}"\nBOT_NAME = "${bot.name}"\n\ngenerateAlert(action) =>\n    action + "_BINANCE_" + syminfo.ticker + "_" + BOT_NAME + "_" + timeframe.period + "_" + BOT_ID\n\nif (longCondition)\n    strategy.entry("Long", strategy.long, alert_message=generateAlert("ENTER-LONG"))\n\nif (ta.crossunder(fastMA, slowMA))\n    strategy.close("Long", alert_message=generateAlert("EXIT-LONG"))`,
                              'pinescript'
                            )}
                          >
                            {copiedField === 'pinescript' ? (
                              <Check className="h-4 w-4 mr-2" />
                            ) : (
                              <Copy className="h-4 w-4 mr-2" />
                            )}
                            Copy
                          </Button>
                        </div>
                      </div>

                      <div className="bg-green-50 dark:bg-green-950 p-3 rounded-md text-sm">
                        <p className="text-green-900 dark:text-green-100">
                          <strong>✨ Tip:</strong> The <code className="bg-green-100 dark:bg-green-900 px-1 py-0.5 rounded">generateAlert()</code> function automatically includes your bot ID and formats the message correctly!
                        </p>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Setup Steps */}
            <Card>
              <CardHeader>
                <CardTitle>Setup Steps</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold shrink-0">1</div>
                    <div>
                      <strong>Create Alert in TradingView</strong>
                      <p className="text-muted-foreground">Open your chart, right-click and select &quot;Add Alert&quot;</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold shrink-0">2</div>
                    <div>
                      <strong>Set Webhook URL</strong>
                      <p className="text-muted-foreground">In the Notifications tab, check &quot;Webhook URL&quot; and paste: <code className="text-xs bg-muted px-1 py-0.5 rounded">{webhookUrl}</code></p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold shrink-0">3</div>
                    <div>
                      <strong>Set Alert Message</strong>
                      <p className="text-muted-foreground">Copy one of the alert messages above into the &quot;Message&quot; field</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold shrink-0">4</div>
                    <div>
                      <strong>Save and Test</strong>
                      <p className="text-muted-foreground">Click &quot;Create&quot; to activate your alert. Test it to ensure it&apos;s working!</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Statistics (if available) */}
            {webhookInfo?.statistics && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Bot Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold">{webhookInfo.statistics.totalSignals}</div>
                      <div className="text-xs text-muted-foreground">Signals</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{webhookInfo.statistics.totalPositions}</div>
                      <div className="text-xs text-muted-foreground">Positions</div>
                    </div>
                    <div>
                      <div className={`text-2xl font-bold ${webhookInfo.statistics.totalPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
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
          </div>
        )}

        <div className="flex justify-end">
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}