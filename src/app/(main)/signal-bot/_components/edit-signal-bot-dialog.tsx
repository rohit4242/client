"use client";

import { useState, useEffect } from "react";
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

import { 
  updateSignalBotSchema, 
  UpdateSignalBotData, 
  SIGNAL_BOT_SYMBOLS,
  ORDER_TYPE_OPTIONS 
} from "@/db/schema/signal-bot";
import { SignalBot } from "@/types/signal-bot";
import { Exchange } from "@/types/exchange";

interface EditSignalBotDialogProps {
  bot: SignalBot;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditSignalBotDialog({ bot, open, onOpenChange, onSuccess }: EditSignalBotDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    resolver: zodResolver(updateSignalBotSchema),
    defaultValues: {
      name: bot.name,
      description: bot.description || "",
      exchangeId: bot.exchangeId,
      symbols: bot.symbols,
      orderType: bot.orderType as "Market" | "Limit",
      portfolioPercent: bot.portfolioPercent,
      leverage: bot.leverage || 1,
      stopLoss: bot.stopLoss,
      takeProfit: bot.takeProfit,
      enterLongMsg: bot.enterLongMsg || "",
      exitLongMsg: bot.exitLongMsg || "",
      enterShortMsg: bot.enterShortMsg || "",
      exitShortMsg: bot.exitShortMsg || "",
    },
  });

  // Reset form when bot changes
  useEffect(() => {
    form.reset({
      name: bot.name,
      description: bot.description || "",
      exchangeId: bot.exchangeId,
      symbols: bot.symbols,
      orderType: bot.orderType as "Market" | "Limit",
      portfolioPercent: bot.portfolioPercent,
      leverage: bot.leverage || 1,
      stopLoss: bot.stopLoss,
      takeProfit: bot.takeProfit,
      enterLongMsg: bot.enterLongMsg || "",
      exitLongMsg: bot.exitLongMsg || "",
      enterShortMsg: bot.enterShortMsg || "",
      exitShortMsg: bot.exitShortMsg || "",
    });
  }, [bot, form]);

  // Fetch exchanges for the dropdown
  const { data: exchanges = [] } = useQuery<Exchange[]>({
    queryKey: ["exchanges"],
    queryFn: async () => {
      const response = await axios.get("/api/exchanges");
      return response.data;
    },
    enabled: open,
  });

  const updateBotMutation = useMutation({
    mutationFn: async (data: UpdateSignalBotData) => {
      const response = await axios.put(`/api/signal-bots/${bot.id}`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Signal bot updated successfully!");
      onSuccess();
    },
    onError: (error: AxiosError<{ error: string }>) => {
      toast.error(error.response?.data?.error || "Failed to update signal bot");
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const onSubmit = (data: UpdateSignalBotData) => {
    setIsSubmitting(true);
    updateBotMutation.mutate(data);
  };

  const activeExchanges = exchanges.filter(exchange => exchange.isActive);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Signal Bot</DialogTitle>
          <DialogDescription>
            Update your bot configuration and settings. Keep it simple and effective.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic Settings</TabsTrigger>
                <TabsTrigger value="risk">Risk Management</TabsTrigger>
                <TabsTrigger value="alerts">Alert Messages</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bot Name</FormLabel>
                      <FormControl>
                        <Input placeholder="My Trading Bot" {...field} />
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
                          placeholder="Describe your trading strategy..."
                          {...field}
                          rows={3}
                        />
                      </FormControl>
                      <FormDescription>
                        Optional description of your bot&apos;s purpose or strategy.
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
                      <FormLabel>Exchange</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an exchange" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {activeExchanges.map((exchange) => (
                            <SelectItem key={exchange.id} value={exchange.id}>
                              {exchange.name} {exchange.accountName && `(${exchange.accountName})`}
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
                      <FormLabel>Trading Symbols</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange([value])} 
                        value={field.value?.[0] || ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select trading pair" />
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
                        Choose the cryptocurrency pair to trade. You can add more symbols later.
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
                          Market orders execute immediately, limit orders at specific prices.
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
                          Percentage of portfolio to use per trade (1-100%).
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
                        Leverage multiplier (1x = no leverage, max 125x). Use with caution!
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="risk" className="space-y-4">
                <div className="space-y-1 mb-4">
                  <h4 className="text-sm font-medium">Risk Management</h4>
                  <p className="text-sm text-muted-foreground">
                    Set automatic stop loss and take profit levels to manage your risk.
                  </p>
                </div>

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
                          Automatic stop loss percentage to limit losses.
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
                          Automatic take profit percentage to secure gains.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <div className="w-4 h-4 bg-blue-500 rounded-full mt-0.5 flex-shrink-0"></div>
                    <div className="text-sm">
                      <p className="font-medium text-blue-900 dark:text-blue-100">Risk Management Tip</p>
                      <p className="text-blue-700 dark:text-blue-300 mt-1">
                        A good risk-reward ratio is 1:2 (e.g., 2% stop loss with 4% take profit). 
                        Never risk more than you can afford to lose.
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="alerts" className="space-y-4">
                <div className="space-y-1 mb-4">
                  <h4 className="text-sm font-medium">Custom Alert Messages</h4>
                  <p className="text-sm text-muted-foreground">
                    Configure custom messages to match your TradingView alerts. Leave blank to use default actions.
                  </p>
                </div>

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
                          Custom message for entering long positions.
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
                          Custom message for exiting long positions.
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
                          Custom message for entering short positions.
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
                          Custom message for exiting short positions.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                  <div className="text-sm">
                    <p className="font-medium mb-2">Example TradingView Alert Setup:</p>
                    <div className="space-y-1 text-muted-foreground">
                      <p>• Long Entry: <code className="bg-white dark:bg-gray-800 px-1 rounded">BUY</code></p>
                      <p>• Long Exit: <code className="bg-white dark:bg-gray-800 px-1 rounded">SELL</code></p>
                      <p>• Short Entry: <code className="bg-white dark:bg-gray-800 px-1 rounded">SHORT</code></p>
                      <p>• Short Exit: <code className="bg-white dark:bg-gray-800 px-1 rounded">COVER</code></p>
                    </div>
                  </div>
                </div>
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
                {isSubmitting ? "Updating..." : "Update Bot"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}