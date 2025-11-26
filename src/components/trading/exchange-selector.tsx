"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { getExchangesForUser } from "@/db/actions/admin/get-exchanges-for-user";
import { Exchange } from "@/types/exchange";

import { Spinner } from "@/components/spinner";

interface ExchangeSelectorProps {
  onSelect: (exchange: Exchange | null) => void;
  selectedExchange: Exchange | null;
  userId: string;
}

export function ExchangeSelector({
  onSelect,
  selectedExchange,
  userId,
}: ExchangeSelectorProps) {
  const {
    data: exchanges,
    isLoading,
    error,
    refetch,
  } = useQuery<Exchange[]>({
    queryKey: ["exchanges", userId],
    queryFn: async () => {
      const exchanges = await getExchangesForUser(userId);
      return exchanges as Exchange[];
    },
  });

  const onRefresh = () => {
    refetch();
  };

  const onExchangeChange = (value: string) => {
    const exchange = exchanges?.find(
      (exchange: Exchange) => exchange.name === value
    );
    onSelect(exchange ?? null);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 items-center justify-center h-full">
        <Spinner />
        <p className="text-sm text-muted-foreground">Loading exchanges...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-2 items-center justify-center h-full">
        <p className="text-sm text-muted-foreground">Error: {error.message}</p>
      </div>
    );
  }

  return (
    <Card className="gap-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Exchange Account</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading || exchanges?.length === 0}
          >
            <RefreshCw
              className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
            />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {/* Exchange Selection */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Exchange</Label>
          <Select
            value={selectedExchange?.name ?? ""}
            onValueChange={onExchangeChange}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select exchange">
                {selectedExchange && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{selectedExchange.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {selectedExchange.name}
                    </Badge>
                  </div>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {exchanges?.map((exchange: Exchange) => (
                <SelectItem key={exchange.name} value={exchange.name}>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{exchange.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {exchange.name}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Exchange Details */}
        {selectedExchange && (
          <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
            {/* Account Section */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Account Type
              </span>
              <div className="flex items-center gap-2">
                <Badge
                  variant={selectedExchange.isActive ? "default" : "secondary"}
                  className={
                    selectedExchange.isActive
                      ? "bg-blue-600 hover:bg-blue-700"
                      : ""
                  }
                >
                  {selectedExchange.isActive ? "Live" : "Demo"}
                </Badge>
                <Badge variant="outline">{selectedExchange.positionMode}</Badge>
              </div>
            </div>

            {/* Balance Section */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Total Balance
              </span>
              <span className="text-sm font-mono">
                ${selectedExchange.totalValue?.toLocaleString() ?? "N/A"}
              </span>
            </div>

            {/* Spot Balance */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Spot Balance
              </span>
              <span className="text-xs font-mono">
                ${selectedExchange.spotValue?.toLocaleString() ?? "0"}
              </span>
            </div>

            {/* Margin Balance */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Margin Balance
              </span>
              <span className="text-xs font-mono">
                ${selectedExchange.marginValue?.toLocaleString() ?? "0"}
              </span>
            </div>

            {/* Additional Info */}
            <div className="pt-2 border-t border-border/50">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Account: {selectedExchange.name}</span>
                {selectedExchange.lastSyncedAt && (
                  <span>
                    Last Sync:{" "}
                    {new Date(selectedExchange.lastSyncedAt).toLocaleDateString(
                      "en-US",
                      {
                        month: "numeric",
                        day: "numeric",
                        year: "numeric",
                      }
                    )}
                    ,{" "}
                    {new Date(selectedExchange.lastSyncedAt).toLocaleTimeString(
                      "en-US",
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      }
                    )}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
