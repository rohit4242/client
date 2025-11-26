"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Bot, TrendingUp, Shield, MessageSquare } from "lucide-react";

import { 
  createSignalBotSchema, 
  CreateSignalBotData, 
  SIGNAL_BOT_SYMBOLS,
  ORDER_TYPE_OPTIONS,
  ACCOUNT_TYPE_OPTIONS,
  SIDE_EFFECT_TYPE_OPTIONS 
} from "@/db/schema/signal-bot";
import { Exchange } from "@/types/exchange";
import { SignalBot } from "@/types/signal-bot";
import { PositionConfirmationDialog } from "@/app/(admin)/signal-bot/_components/dialogs/position-confirmation-dialog";

interface CreateSignalBotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateSignalBotDialog({ open, onOpenChange, onSuccess }: CreateSignalBotDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdBot, setCreatedBot] = useState<SignalBot | null>(null);
  const [showPositionDialog, setShowPositionDialog] = useState(false);

  const form = useForm({
    resolver: zodResolver(createSignalBotSchema),
    defaultValues: {
      name: "",
      description: "",
      exchangeId: "",
      symbols: ["BTCUSDT"],
      orderType: "Market" as const,
      portfolioPercent: 20,
      leverage: 1,
      accountType: "SPOT" as const,
      marginType: "CROSS" as const,
      sideEffectType: "NO_SIDE_EFFECT" as const,
      autoRepay: false,
      maxBorrowPercent: 50,
      stopLoss: null,
      takeProfit: null,
      enterLongMsg: "",
      exitLongMsg: "",
      enterShortMsg: "",
      exitShortMsg: "",
    },
  });

  // Fetch exchanges for the dropdown
  const { data: exchanges = [] } = useQuery<Exchange[]>({
    queryKey: ["exchanges"],
    queryFn: async () => {
      const response = await axios.get("/api/exchanges");
      return response.data;
    },
    enabled: open,
  });

  const createBotMutation = useMutation({
    mutationFn: async (data: CreateSignalBotData) => {
      const response = await axios.post("/api/signal-bots", data);
      return response.data;
    },
    onSuccess: (data: SignalBot) => {
      toast.success("Signal bot created successfully!");
      form.reset();
      setCreatedBot(data);
      onOpenChange(false); // Close create dialog
      setShowPositionDialog(true); // Show position dialog
    },
    onError: (error: AxiosError<{ error: string }>) => {
      toast.error(error.response?.data?.error || "Failed to create signal bot");
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const onSubmit = (data: CreateSignalBotData) => {
    setIsSubmitting(true);
    createBotMutation.mutate(data);
  };

  const activeExchanges = exchanges.filter(exchange => exchange.isActive);

  const handlePositionDialogComplete = () => {
    setShowPositionDialog(false);
    setCreatedBot(null);
    onSuccess(); // Refresh the bot list
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Bot className="h-5 w-5" />
            <span>Create Signal Bot</span>
          </DialogTitle>
          <DialogDescription>
            Set up a simple, effective trading bot that responds to TradingView signals.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic" className="flex items-center space-x-1">
                  <TrendingUp className="h-4 w-4" />
                  <span>Basic Setup</span>
                </TabsTrigger>
                <TabsTrigger value="risk" className="flex items-center space-x-1">
                  <Shield className="h-4 w-4" />
                  <span>Risk Management</span>
                </TabsTrigger>
                <TabsTrigger value="alerts" className="flex items-center space-x-1">
                  <MessageSquare className="h-4 w-4" />
                  <span>Alert Messages</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Bot Configuration</CardTitle>
                    <CardDescription>
                      Configure your bot&apos;s basic settings and trading parameters.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bot Name</FormLabel>
                          <FormControl>
                            <Input placeholder="My BTC Trading Bot" {...field} />
                          </FormControl>
                          <FormDescription>
                            Give your bot a unique, descriptive name.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description (Optional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe your trading strategy or bot purpose..."
                              {...field}
                              rows={3}
                            />
                          </FormControl>
                          <FormDescription>
                            Optional description to help you remember this bot&apos;s purpose.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="exchangeId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Exchange Account</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select an exchange account" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {activeExchanges.map((exchange) => (
                                <SelectItem key={exchange.id} value={exchange.id}>
                                  {exchange.name} {exchange.name && `(${exchange.name})`}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Choose which exchange account to use for trading.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="symbols"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Trading Symbol</FormLabel>
                          <Select 
                            onValueChange={(value) => field.onChange([value])} 
                            value={field.value?.[0] || ""}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a trading pair" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {SIGNAL_BOT_SYMBOLS.map((symbol) => (
                                <SelectItem key={symbol} value={symbol}>
                                  {symbol}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Choose the cryptocurrency pair you want to trade.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="orderType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Order Type</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select order type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {ORDER_TYPE_OPTIONS.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Market orders execute immediately.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="portfolioPercent"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Portfolio Percentage (%)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="1" 
                                max="100" 
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormDescription>
                              % of portfolio to use per trade.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="leverage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Leverage (Optional)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="1" 
                              max="125" 
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : 1)}
                              value={field.value || 1}
                            />
                          </FormControl>
                          <FormDescription>
                            Leverage multiplier (1x = no leverage). Use with extreme caution!
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="accountType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Account Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select account type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {ACCOUNT_TYPE_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Choose between spot or margin trading.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {form.watch("accountType") === "MARGIN" && (
                      <>
                        <FormField
                          control={form.control}
                          name="sideEffectType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Side Effect Type</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select side effect type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {SIDE_EFFECT_TYPE_OPTIONS.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      <div>
                                        <div>{option.label}</div>
                                        <div className="text-xs text-muted-foreground">{option.description}</div>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                Controls automatic borrowing and repayment behavior for margin orders.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="autoRepay"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-base">Auto Repay</FormLabel>
                                  <FormDescription>
                                    Automatically repay debt when closing positions
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="maxBorrowPercent"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Max Borrow (%)</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    min="1" 
                                    max="100" 
                                    {...field}
                                    onChange={(e) => field.onChange(Number(e.target.value))}
                                  />
                                </FormControl>
                                <FormDescription>
                                  Maximum % of collateral to borrow
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </>
                    )}

                    {/* Portfolio Value Preview */}
                    {form.watch("exchangeId") && (
                      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm text-blue-700 dark:text-blue-300">Portfolio Overview</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {(() => {
                            const selectedExchange = activeExchanges.find(e => e.id === form.watch("exchangeId"));
                            if (!selectedExchange) return null;
                            
                            const accountType = form.watch("accountType") || "SPOT";
                            const portfolioPercent = form.watch("portfolioPercent") || 0;
                            const leverage = form.watch("leverage") || 1;
                            
                            const spotValue = selectedExchange.spotValue || 0;
                            const marginValue = selectedExchange.marginValue || 0;
                            const activeValue = accountType === "SPOT" ? spotValue : marginValue;
                            const positionValue = (activeValue * portfolioPercent) / 100;
                            const totalPositionSize = positionValue * leverage;
                            
                            return (
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between text-blue-600 dark:text-blue-400">
                                  <span>Spot Balance:</span>
                                  <span className="font-mono">${spotValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between text-blue-600 dark:text-blue-400">
                                  <span>Margin Balance:</span>
                                  <span className="font-mono">${marginValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                                <div className="pt-2 border-t border-blue-200 dark:border-blue-800">
                                  <div className="flex justify-between text-blue-800 dark:text-blue-200 font-medium">
                                    <span>Using ({accountType}):</span>
                                    <span className="font-mono">${activeValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                  </div>
                                  <div className="flex justify-between text-blue-700 dark:text-blue-300 text-xs mt-1">
                                    <span>Position Size ({portfolioPercent}%):</span>
                                    <span className="font-mono">${positionValue.toFixed(2)}</span>
                                  </div>
                                  {leverage > 1 && (
                                    <div className="flex justify-between text-blue-700 dark:text-blue-300 text-xs mt-1">
                                      <span>With {leverage}x Leverage:</span>
                                      <span className="font-mono">${totalPositionSize.toFixed(2)}</span>
                                    </div>
                                  )}
                                </div>
                                {activeValue <= 0 && (
                                  <div className="pt-2 text-xs text-amber-600 dark:text-amber-400 flex items-start space-x-1">
                                    <Shield className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                    <span>⚠️ Low or zero balance in {accountType} account. Please add funds or select a different account type.</span>
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </CardContent>
                      </Card>
                    )}

                    {form.watch("accountType") === "MARGIN" && (
                      <div className="bg-amber-50 dark:bg-amber-950 p-4 rounded-lg">
                        <div className="flex items-start space-x-2">
                          <Shield className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                          <div className="text-sm">
                            <p className="font-medium text-amber-900 dark:text-amber-100">Cross Margin Trading Warning</p>
                            <ul className="text-amber-700 dark:text-amber-300 mt-1 space-y-1">
                              <li>• Cross margin allows borrowing assets across your entire margin account</li>
                              <li>• Borrowed assets accrue interest hourly and must be repaid</li>
                              <li>• Auto repay will automatically repay debt when you close positions</li>
                              <li>• Max borrow % limits how much you can borrow relative to your collateral</li>
                              <li>• Only use margin if you understand the risks</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="risk" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Risk Management</CardTitle>
                    <CardDescription>
                      Set automatic stop loss and take profit levels to protect your capital.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="stopLoss"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Stop Loss (%)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.1" 
                                min="0.1" 
                                max="50" 
                                {...field}
                                onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                                value={field.value || ""}
                                placeholder="e.g., 2.0"
                              />
                            </FormControl>
                            <FormDescription>
                              Automatic stop loss to limit losses.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="takeProfit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Take Profit (%)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.1" 
                                min="0.1" 
                                max="100" 
                                {...field}
                                onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                                value={field.value || ""}
                                placeholder="e.g., 4.0"
                              />
                            </FormControl>
                            <FormDescription>
                              Automatic take profit to secure gains.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="bg-amber-50 dark:bg-amber-950 p-4 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <Shield className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                        <div className="text-sm">
                          <p className="font-medium text-amber-900 dark:text-amber-100">Risk Management Best Practices</p>
                          <ul className="text-amber-700 dark:text-amber-300 mt-1 space-y-1">
                            <li>• Use a 1:2 risk-reward ratio (e.g., 2% stop loss, 4% take profit)</li>
                            <li>• Never risk more than 2-5% of your portfolio per trade</li>
                            <li>• Always set stop loss to protect your capital</li>
                            <li>• Start with small position sizes until you&apos;re confident</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="alerts" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Custom Alert Messages</CardTitle>
                    <CardDescription>
                      Configure custom messages to match your TradingView alerts. Leave blank to use standard actions.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="enterLongMsg"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Enter Long Message</FormLabel>
                            <FormControl>
                              <Input placeholder="BUY" {...field} />
                            </FormControl>
                            <FormDescription>
                              Custom message for long entries.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="exitLongMsg"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Exit Long Message</FormLabel>
                            <FormControl>
                              <Input placeholder="SELL" {...field} />
                            </FormControl>
                            <FormDescription>
                              Custom message for long exits.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="enterShortMsg"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Enter Short Message</FormLabel>
                            <FormControl>
                              <Input placeholder="SHORT" {...field} />
                            </FormControl>
                            <FormDescription>
                              Custom message for short entries.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="exitShortMsg"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Exit Short Message</FormLabel>
                            <FormControl>
                              <Input placeholder="COVER" {...field} />
                            </FormControl>
                            <FormDescription>
                              Custom message for short exits.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                      <div className="text-sm">
                        <p className="font-medium mb-2 text-blue-900 dark:text-blue-100">TradingView Alert Example</p>
                        <div className="space-y-2 text-blue-700 dark:text-blue-300">
                          <p>In your TradingView alert, use this webhook URL and payload:</p>
                          <div className="bg-white dark:bg-gray-800 p-2 rounded border font-mono text-xs">
                            {`{
  "botId": "your-bot-id",
  "secret": "your-webhook-secret",
  "action": "BUY",
  "symbol": "BTCUSDT",
  "price": {{close}}
}`}
                          </div>
                          <p className="text-xs">You&apos;ll get the webhook URL and secret after creating the bot.</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <Separator />

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Bot"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>

    {/* Position Confirmation Dialog */}
    {createdBot && (
      <PositionConfirmationDialog
        bot={createdBot}
        open={showPositionDialog}
        onOpenChange={setShowPositionDialog}
        onSuccess={handlePositionDialogComplete}
      />
    )}
    </>
  );
}