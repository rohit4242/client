"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Copy,
  Globe,
  Code2,
  CheckCircle2,
  Send,
  Loader2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Activity
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import { BotWithExchange } from "@/features/signal-bot";

interface WebhookInfoDialogProps {
  bot: BotWithExchange;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WebhookInfoDialog({ bot, open, onOpenChange }: WebhookInfoDialogProps) {
  const [testingWebhook, setTestingWebhook] = useState(false);

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied!`);
    } catch {
      toast.error(`Failed to copy ${label}`);
    }
  };

  // Construct webhook URL directly
  const webhookUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/api/webhook/signal-bot/${bot.id}`;

  // Fetch recent signals
  const { data: recentSignals } = useQuery({
    queryKey: ["recent-signals", bot.id],
    queryFn: async () => {
      const response = await axios.get(`/api/signal-bots/${bot.id}/signals?limit=5`);
      return response.data;
    },
    enabled: open,
  });

  // Test webhook mutation
  const testWebhookMutation = useMutation({
    mutationFn: async () => {
      const testPayload = {
        action: "ENTER_LONG",
        symbol: bot.symbols[0] || "BTCUSDT",
        price: 45000,
        message: "Test signal from webhook dialog"
      };

      const response = await axios.post(webhookUrl, testPayload, {
        headers: { "Content-Type": "application/json" }
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success("Test webhook sent successfully!");
      setTestingWebhook(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to send test webhook");
      setTestingWebhook(false);
    },
  });

  const handleTestWebhook = () => {
    setTestingWebhook(true);
    testWebhookMutation.mutate();
  };

  // Payload examples
  const symbol = bot.symbols[0] || "BTCUSDT";

  const basicExample = {
    action: "ENTER_LONG",
    symbol: symbol,
    price: 45000
  };

  const tradingViewExample = {
    action: "{{strategy.order.action}}",
    symbol: "{{ticker}}",
    price: "{{close}}",
    message: "Signal from {{timenow}}"
  };

  const advancedExample = {
    action: "EXIT_LONG",
    symbol: "ETHUSDT",
    price: 3000.50,
    message: "Take profit hit at resistance level"
  };

  // Plain text examples
  const plainTextExamples = {
    enterLong: `ENTER-LONG_BINANCE_${symbol}_${bot.name}_4M_${bot.id}`,
    exitLong: `EXIT-LONG_BINANCE_${symbol}_${bot.name}_4M_${bot.id}`,
    enterShort: `ENTER-SHORT_BINANCE_${symbol}_${bot.name}_4M_${bot.id}`,
    exitShort: `EXIT-SHORT_BINANCE_${symbol}_${bot.name}_4M_${bot.id}`,
  };

  const curlExample = `curl -X POST "${webhookUrl}" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(basicExample, null, 2)}'`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Globe className="h-5 w-5" />
            <span>Webhook Integration - {bot.name}</span>
          </DialogTitle>
          <DialogDescription>
            Send trading signals from TradingView or any platform using webhooks
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="setup" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="setup">Quick Setup</TabsTrigger>
            <TabsTrigger value="examples">Examples</TabsTrigger>
            <TabsTrigger value="testing">Testing</TabsTrigger>
            <TabsTrigger value="config">Bot Config</TabsTrigger>
          </TabsList>

          {/* Quick Setup Tab */}
          <TabsContent value="setup" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Webhook URL</CardTitle>
                <CardDescription>Use this URL in your TradingView alerts or API requests</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2">
                  <code className="flex-1 bg-muted p-3 rounded text-xs font-mono break-all">
                    {webhookUrl}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(webhookUrl, "Webhook URL")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded text-xs space-y-1">
                  <p className="font-medium text-blue-900 dark:text-blue-100">📝 Supported Formats:</p>
                  <div className="text-blue-700 dark:text-blue-300 space-y-0.5">
                    <p>• <strong>JSON Format:</strong> Content-Type: <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">application/json</code></p>
                    <p>• <strong>Plain Text Format:</strong> Underscore-separated (TradingView friendly)</p>
                    <p>• Both formats are auto-detected - no configuration needed!</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Basic JSON Payload</CardTitle>
                <CardDescription>Copy this and paste into your TradingView alert message</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(JSON.stringify(basicExample, null, 2), "Payload")}
                    className="text-xs"
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy JSON
                  </Button>
                </div>
                <pre className="bg-muted p-3 rounded text-xs font-mono overflow-x-auto">
                  {JSON.stringify(basicExample, null, 2)}
                </pre>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">TradingView Setup (3 Steps)</CardTitle>
                <CardDescription>Choose either JSON or Plain Text format</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">1</div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Create Alert with Webhook</p>
                      <p className="text-xs text-muted-foreground">In TradingView, create an alert and check &quot;Webhook URL&quot;</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">2</div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Paste Webhook URL</p>
                      <p className="text-xs text-muted-foreground">Copy the webhook URL above and paste it in the URL field</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">3</div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Add Message Payload</p>
                      <p className="text-xs text-muted-foreground">
                        <strong>Option A (Recommended):</strong> Use plain text format from Examples tab - just copy and paste!
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        <strong>Option B:</strong> Use JSON format if you need dynamic variables like {`{{close}}`} or {`{{ticker}}`}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Examples Tab */}
          <TabsContent value="examples" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Code2 className="h-4 w-4" />
                  Payload Examples
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="basic">
                    <AccordionTrigger className="text-sm">Basic Example (Required Fields Only)</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(JSON.stringify(basicExample, null, 2), "Basic Example")}
                          className="text-xs mb-2"
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Copy
                        </Button>
                        <pre className="bg-muted p-3 rounded text-xs font-mono overflow-x-auto">
                          {JSON.stringify(basicExample, null, 2)}
                        </pre>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="tradingview">
                    <AccordionTrigger className="text-sm">TradingView Example (With Variables)</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(JSON.stringify(tradingViewExample, null, 2), "TradingView Example")}
                          className="text-xs mb-2"
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Copy
                        </Button>
                        <pre className="bg-muted p-3 rounded text-xs font-mono overflow-x-auto">
                          {JSON.stringify(tradingViewExample, null, 2)}
                        </pre>
                        <div className="bg-amber-50 dark:bg-amber-950 p-2 rounded text-xs">
                          <p className="text-amber-900 dark:text-amber-100 font-medium mb-1">💡 TradingView Variables:</p>
                          <ul className="text-amber-700 dark:text-amber-300 space-y-0.5 text-xs">
                            <li>• <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">{"{{close}}"}</code> - Current close price</li>
                            <li>• <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">{"{{ticker}}"}</code> - Symbol (e.g., BTCUSDT)</li>
                            <li>• <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">{"{{timenow}}"}</code> - Current timestamp</li>
                            <li>• <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">{"{{strategy.order.action}}"}</code> - Strategy action</li>
                          </ul>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="advanced">
                    <AccordionTrigger className="text-sm">Advanced Example (With Message)</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(JSON.stringify(advancedExample, null, 2), "Advanced Example")}
                          className="text-xs mb-2"
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Copy
                        </Button>
                        <pre className="bg-muted p-3 rounded text-xs font-mono overflow-x-auto">
                          {JSON.stringify(advancedExample, null, 2)}
                        </pre>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="plaintext">
                    <AccordionTrigger className="text-sm">Plain Text Format (TradingView Friendly)</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2">
                        <div className="bg-amber-50 dark:bg-amber-950 p-2 rounded text-xs mb-2">
                          <p className="text-amber-900 dark:text-amber-100 font-medium mb-1">📋 Format Structure:</p>
                          <code className="text-amber-700 dark:text-amber-300 text-xs">
                            ACTION_EXCHANGE_SYMBOL_BOTNAME_TIMEFRAME_BOTID
                          </code>
                        </div>

                        <div className="space-y-2">
                          <div>
                            <p className="text-xs font-medium mb-1">Enter Long:</p>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyToClipboard(plainTextExamples.enterLong, "Enter Long Example")}
                              className="text-xs mb-1"
                            >
                              <Copy className="h-3 w-3 mr-1" />
                              Copy
                            </Button>
                            <pre className="bg-muted p-2 rounded text-xs font-mono overflow-x-auto">
                              {plainTextExamples.enterLong}
                            </pre>
                          </div>

                          <div>
                            <p className="text-xs font-medium mb-1">Exit Long:</p>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyToClipboard(plainTextExamples.exitLong, "Exit Long Example")}
                              className="text-xs mb-1"
                            >
                              <Copy className="h-3 w-3 mr-1" />
                              Copy
                            </Button>
                            <pre className="bg-muted p-2 rounded text-xs font-mono overflow-x-auto">
                              {plainTextExamples.exitLong}
                            </pre>
                          </div>

                          {bot.accountType === "MARGIN" && (
                            <>
                              <div>
                                <p className="text-xs font-medium mb-1">Enter Short:</p>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => copyToClipboard(plainTextExamples.enterShort, "Enter Short Example")}
                                  className="text-xs mb-1"
                                >
                                  <Copy className="h-3 w-3 mr-1" />
                                  Copy
                                </Button>
                                <pre className="bg-muted p-2 rounded text-xs font-mono overflow-x-auto">
                                  {plainTextExamples.enterShort}
                                </pre>
                              </div>

                              <div>
                                <p className="text-xs font-medium mb-1">Exit Short:</p>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => copyToClipboard(plainTextExamples.exitShort, "Exit Short Example")}
                                  className="text-xs mb-1"
                                >
                                  <Copy className="h-3 w-3 mr-1" />
                                  Copy
                                </Button>
                                <pre className="bg-muted p-2 rounded text-xs font-mono overflow-x-auto">
                                  {plainTextExamples.exitShort}
                                </pre>
                              </div>
                            </>
                          )}
                        </div>

                        <div className="bg-green-50 dark:bg-green-950 p-2 rounded text-xs mt-2">
                          <p className="text-green-900 dark:text-green-100 font-medium mb-1">✨ Benefits:</p>
                          <ul className="text-green-700 dark:text-green-300 space-y-0.5 text-xs">
                            <li>• No JSON formatting required</li>
                            <li>• Perfect for TradingView alerts</li>
                            <li>• Copy and paste directly into alert message</li>
                            <li>• No webhook secret needed (Bot ID is in URL)</li>
                          </ul>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Supported Actions</CardTitle>
                <CardDescription>All action aliases that you can use</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">Enter Long (Buy)</span>
                    </div>
                    <div className="bg-green-50 dark:bg-green-950 p-2 rounded">
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="outline" className="text-xs">ENTER_LONG</Badge>
                        <Badge variant="outline" className="text-xs">ENTERLONG</Badge>
                        <Badge variant="outline" className="text-xs">LONG</Badge>
                        <Badge variant="outline" className="text-xs">BUY</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-red-600" />
                      <span className="text-sm font-medium">Exit Long (Sell)</span>
                    </div>
                    <div className="bg-red-50 dark:bg-red-950 p-2 rounded">
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="outline" className="text-xs">EXIT_LONG</Badge>
                        <Badge variant="outline" className="text-xs">EXITLONG</Badge>
                        <Badge variant="outline" className="text-xs">CLOSE_LONG</Badge>
                        <Badge variant="outline" className="text-xs">CLOSELONG</Badge>
                        <Badge variant="outline" className="text-xs">SELL_LONG</Badge>
                        <Badge variant="outline" className="text-xs">SELL</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-orange-600" />
                      <span className="text-sm font-medium">Enter Short</span>
                    </div>
                    <div className="bg-orange-50 dark:bg-orange-950 p-2 rounded">
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="outline" className="text-xs">ENTER_SHORT</Badge>
                        <Badge variant="outline" className="text-xs">ENTERSHORT</Badge>
                        <Badge variant="outline" className="text-xs">SHORT</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium">Exit Short (Cover)</span>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-950 p-2 rounded">
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="outline" className="text-xs">EXIT_SHORT</Badge>
                        <Badge variant="outline" className="text-xs">EXITSHORT</Badge>
                        <Badge variant="outline" className="text-xs">CLOSE_SHORT</Badge>
                        <Badge variant="outline" className="text-xs">CLOSESHORT</Badge>
                        <Badge variant="outline" className="text-xs">BUY_SHORT</Badge>
                        <Badge variant="outline" className="text-xs">COVER</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Testing Tab */}
          <TabsContent value="testing" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Send className="h-4 w-4" />
                  Test Webhook
                </CardTitle>
                <CardDescription>Send a test signal to verify your webhook is working</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Tabs defaultValue="json" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="json">JSON Format</TabsTrigger>
                    <TabsTrigger value="plaintext">Plain Text</TabsTrigger>
                  </TabsList>

                  <TabsContent value="json" className="space-y-3">
                    <div className="bg-muted p-3 rounded space-y-2">
                      <p className="text-sm font-medium">Test Payload (JSON):</p>
                      <pre className="text-xs font-mono">
                        {JSON.stringify({
                          action: "ENTER_LONG",
                          symbol: bot.symbols[0] || "BTCUSDT",
                          price: 45000,
                          message: "Test signal"
                        }, null, 2)}
                      </pre>
                    </div>
                    <Button
                      onClick={handleTestWebhook}
                      disabled={testingWebhook || !bot.isActive}
                      className="w-full"
                    >
                      {testingWebhook ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending Test...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Send JSON Test Signal
                        </>
                      )}
                    </Button>
                  </TabsContent>

                  <TabsContent value="plaintext" className="space-y-3">
                    <div className="bg-muted p-3 rounded space-y-2">
                      <p className="text-sm font-medium">Test Payload (Plain Text):</p>
                      <pre className="text-xs font-mono break-all">
                        {plainTextExamples.enterLong}
                      </pre>
                    </div>
                    <Button
                      onClick={() => {
                        setTestingWebhook(true);
                        axios.post(webhookUrl, plainTextExamples.enterLong, {
                          headers: { "Content-Type": "text/plain" }
                        })
                          .then(() => {
                            toast.success("Test webhook sent successfully!");
                            setTestingWebhook(false);
                          })
                          .catch((error: any) => {
                            toast.error(error.response?.data?.error || "Failed to send test webhook");
                            setTestingWebhook(false);
                          });
                      }}
                      disabled={testingWebhook || !bot.isActive}
                      className="w-full"
                    >
                      {testingWebhook ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending Test...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Send Plain Text Test Signal
                        </>
                      )}
                    </Button>
                  </TabsContent>
                </Tabs>

                {!bot.isActive && (
                  <div className="flex items-start gap-2 text-amber-600 text-xs bg-amber-50 dark:bg-amber-950/50 p-2 rounded">
                    <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                    <span>Bot must be active to test webhook</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">cURL Example</CardTitle>
                <CardDescription>Test from command line or API client</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(curlExample, "cURL command")}
                    className="text-xs"
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy cURL
                  </Button>
                </div>
                <pre className="bg-muted p-3 rounded text-xs font-mono overflow-x-auto whitespace-pre-wrap">
                  {curlExample}
                </pre>
              </CardContent>
            </Card>

            {recentSignals && recentSignals.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Recent Signals
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {recentSignals.map((signal: any) => (
                      <div key={signal.id} className="flex items-center justify-between p-2 bg-muted rounded text-xs">
                        <div className="flex items-center gap-2">
                          <Badge variant={signal.processed ? "default" : "secondary"} className="text-xs">
                            {signal.action}
                          </Badge>
                          <span className="font-mono">{signal.symbol}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {signal.error ? (
                            <Badge variant="destructive" className="text-xs">Error</Badge>
                          ) : signal.processed ? (
                            <Badge variant="outline" className="text-xs text-green-600">Success</Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">Pending</Badge>
                          )}
                          <span className="text-muted-foreground">
                            {new Date(signal.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Bot Config Tab */}
          <TabsContent value="config" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Current Bot Configuration</CardTitle>
                <CardDescription>These settings will be applied to all webhook signals</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Account Type:</span>
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
                    <span className="text-muted-foreground">Configured Symbols:</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {bot.symbols.map(symbol => (
                        <Badge key={symbol} variant="outline" className="text-xs">{symbol}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Trade Amount:</span>
                    <p className="font-medium mt-1">
                      {bot.tradeAmountType === "QUOTE"
                        ? `$${bot.tradeAmount?.toFixed(2) || 0}`
                        : `${bot.tradeAmount?.toFixed(6) || 0} ${bot.symbols[0]?.replace('USDT', '') || 'BASE'}`}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Leverage:</span>
                    <p className="font-medium mt-1">{bot.leverage}x</p>
                  </div>
                  {bot.stopLoss && (
                    <div>
                      <span className="text-muted-foreground">Stop Loss:</span>
                      <p className="font-medium text-red-600 mt-1">{bot.stopLoss}%</p>
                    </div>
                  )}
                  {bot.takeProfit && (
                    <div>
                      <span className="text-muted-foreground">Take Profit:</span>
                      <p className="font-medium text-green-600 mt-1">{bot.takeProfit}%</p>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">Order Type:</span>
                    <p className="font-medium mt-1">{bot.orderType}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status:</span>
                    <div className="mt-1">
                      <Badge variant={bot.isActive ? "default" : "secondary"} className="text-xs">
                        {bot.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                </div>

                {!bot.isActive && (
                  <div className="mt-4 flex items-start gap-2 text-amber-600 text-xs bg-amber-50 dark:bg-amber-950/50 p-3 rounded">
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Bot is currently inactive</p>
                      <p className="mt-1">Activate the bot to start receiving and processing webhook signals</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Important Notes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <p>Only symbols configured in this bot will be accepted</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <p>Price is optional - if not provided, current market price will be used</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <p>All actions are case-insensitive and support multiple aliases</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <p>Bot must be active to process signals</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end pt-2">
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </div>
      </DialogContent >
    </Dialog >
  );
}
