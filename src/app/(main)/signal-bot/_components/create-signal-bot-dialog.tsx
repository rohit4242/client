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
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

import { createSignalBotSchema, CreateSignalBotData, TIMEFRAME_OPTIONS, SIGNAL_BOT_SYMBOLS } from "@/db/schema/signal-bot";
import { Exchange } from "@/types/exchange";

interface CreateSignalBotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateSignalBotDialog({ open, onOpenChange, onSuccess }: CreateSignalBotDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    resolver: zodResolver(createSignalBotSchema),
    defaultValues: {
      name: "",
      exchangeId: "",
      symbol: "BTCUSDT",
      timeframe: "5m",
      portfolioPercent: 20,
      stopLoss: 2,
      takeProfit: 4,
      trailingStop: false,
      dcaEnabled: false,
      dcaSteps: 3,
      dcaStepPercent: 2,
      enterLongMsg: "",
      exitLongMsg: "",
      enterShortMsg: "",
      exitShortMsg: "",
      exitAllMsg: "",
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
    onSuccess: () => {
      toast.success("Signal bot created successfully!");
      form.reset();
      onSuccess();
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Signal Bot</DialogTitle>
          <DialogDescription>
            Set up a new automated trading bot that responds to TradingView signals.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Basic</TabsTrigger>
                <TabsTrigger value="risk">Risk</TabsTrigger>
                <TabsTrigger value="dca">DCA</TabsTrigger>
                <TabsTrigger value="alerts">Alerts</TabsTrigger>
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
                  name="exchangeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Exchange</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="symbol"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Trading Pair</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select symbol" />
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
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="timeframe"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Timeframe</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select timeframe" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {TIMEFRAME_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="portfolioPercent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Portfolio Percentage</FormLabel>
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
                        Percentage of your portfolio to use per trade (1-100%).
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="risk" className="space-y-4">
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
                          />
                        </FormControl>
                        <FormDescription>
                          Automatic stop loss percentage.
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
                          />
                        </FormControl>
                        <FormDescription>
                          Automatic take profit percentage.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="trailingStop"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Trailing Stop</FormLabel>
                        <FormDescription>
                          Automatically adjust stop loss as price moves in your favor.
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
              </TabsContent>

              <TabsContent value="dca" className="space-y-4">
                <FormField
                  control={form.control}
                  name="dcaEnabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Enable DCA</FormLabel>
                        <FormDescription>
                          Dollar Cost Averaging - buy more as price drops.
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

                {form.watch("dcaEnabled") && (
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="dcaSteps"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>DCA Steps</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="2" 
                              max="10" 
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormDescription>
                            Number of DCA buy orders (2-10).
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dcaStepPercent"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Step Percentage</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.1" 
                              min="0.5" 
                              max="10" 
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormDescription>
                            Price drop % between DCA orders.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </TabsContent>

              <TabsContent value="alerts" className="space-y-4">
                <div className="space-y-1 mb-4">
                  <h4 className="text-sm font-medium">Custom Alert Messages</h4>
                  <p className="text-sm text-muted-foreground">
                    Configure custom messages to match your TradingView alerts (optional).
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
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="exitAllMsg"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Exit All Message</FormLabel>
                      <FormControl>
                        <Input placeholder="CLOSE_ALL" {...field} />
                      </FormControl>
                      <FormDescription>
                        Message to close all positions.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
  );
}
