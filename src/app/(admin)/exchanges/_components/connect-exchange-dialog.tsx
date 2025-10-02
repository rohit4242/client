"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Copy, Eye, EyeOff } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Exchange } from '@/types/exchange';
import { createExchange } from "@/db/actions/exchange/create-exchange";
import { updateExchange } from "@/db/actions/exchange/update-exchange";

interface ConnectExchangeDialogProps {
  exchange?: Exchange | null;
  onSuccess: (exchange: Exchange) => void;
  onClose: () => void;
  userId?: string;
}

const formSchema = z.object({
  name: z.string().min(1, "Account name is required"),
  apiKey: z.string().min(1, "API key is required"),
  apiSecret: z.string().min(1, "API secret is required"),
  positionMode: z.enum(["One_Way", "Hedge"]),
});

type FormData = z.infer<typeof formSchema>;

export function ConnectExchangeDialog({
  exchange,
  onSuccess,
  onClose,
  userId,
}: ConnectExchangeDialogProps) {
  const [loading, setLoading] = useState(false);
  const [showApiSecret, setShowApiSecret] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: exchange?.name || "",
      apiKey: exchange?.apiKey || "",
      apiSecret: exchange?.apiSecret || "",
      positionMode: exchange?.positionMode || "One_Way",
    },
  });

  const ipAddresses = [
    "3.122.50.188",
    "18.192.238.182", 
    "3.72.244.137",
    "18.185.137.24",
  ];

  const copyIpAddresses = () => {
    navigator.clipboard.writeText(ipAddresses.join("\n"));
    toast.success("IP addresses copied to clipboard");
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      let response;
      
      if (exchange) {
        // Update existing exchange
        response = await updateExchange(exchange.id, {
          name: data.name,
          apiKey: data.apiKey,
          apiSecret: data.apiSecret,
          positionMode: data.positionMode,
        });
      } else {
        // Create new exchange
        response = await createExchange({
          name: data.name,
          apiKey: data.apiKey,
          apiSecret: data.apiSecret,
          positionMode: data.positionMode,
        }, userId);
      }
      
      console.log("Exchange operation response:", response);
      
      if (response && !response.error) {
        toast.success(
          exchange 
            ? "Exchange updated successfully!" 
            : "Exchange connected successfully!"
        );
        onSuccess(response);
        onClose();
      } else {
        // Show the specific error message from the API
        const errorMessage = response?.error || 
          `Failed to ${exchange ? 'update' : 'save'} exchange`;
        console.log("Showing error toast:", errorMessage);
        toast.error(errorMessage);
        console.log("Exchange operation failed:", response);
      }
    } catch (error) {
      console.error("Error with exchange operation", error);
      toast.error(
        error instanceof Error 
          ? error.message 
          : `Error ${exchange ? 'updating' : 'saving'} exchange`
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (exchange) {
      form.reset({
        name: exchange.name || "",
        apiKey: exchange.apiKey,
        apiSecret: exchange.apiSecret,
        positionMode: exchange.positionMode,
      });
    }
  }, [exchange, form]);

  return (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>
          {exchange ? "Edit Exchange" : "Connect BINANCE"}
        </DialogTitle>
        <DialogDescription>
          {exchange
            ? "Update your exchange connection settings"
            : "Connect your Binance account securely with API keys"}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-6">
        {!exchange && (
          <div className="bg-muted/50 p-4 rounded-lg space-y-3">
            <h4 className="font-medium">Connect key securely Full guide</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>1. Log in to your exchange account and go to API Settings.</p>
              <p>
                2. Turn on IP whitelisting and copy/paste the following list of
                IP addresses:
              </p>

              <div className="flex items-center space-x-2 bg-blue-600 text-white px-3 py-2 rounded">
                <code className="flex-1 text-sm font-mono">
                  {ipAddresses.join(" ")}
                </code>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={copyIpAddresses}
                  className="text-white hover:bg-blue-700"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>

              <p>3. Paste generated data in inputs below.</p>
            </div>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter a name for this account"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="apiKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>API Key</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your API key" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="apiSecret"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>API Secret</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showApiSecret ? "text" : "password"}
                        placeholder="Enter your API secret"
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowApiSecret(!showApiSecret)}
                      >
                        {showApiSecret ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="positionMode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Position mode</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="flex flex-col space-y-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="OneWay" id="one-way" />
                        <label
                          htmlFor="one-way"
                          className="text-sm font-medium cursor-pointer"
                        >
                          One way
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Hedge" id="hedge" />
                        <label
                          htmlFor="hedge"
                          className="text-sm font-medium cursor-pointer"
                        >
                          Hedge
                        </label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-between items-center pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <div className="flex items-center space-x-2">
                {!exchange && (
                  <Button
                    type="button"
                    variant="outline"
                    className="flex items-center space-x-2"
                  >
                    <span>💖</span>
                    <span>Favourite</span>
                  </Button>
                )}
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {loading
                    ? "Connecting..."
                    : exchange
                    ? "Update Exchange"
                    : "Connect an exchange"}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </DialogContent>
  );
}