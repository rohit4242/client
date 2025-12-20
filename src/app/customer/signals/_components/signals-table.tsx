"use client";

import { useState } from "react";
import { SignalWithBot } from "@/features/signals";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Bot, CheckCircle2, XCircle, Clock, Radio } from "lucide-react";
import {
  TrendingUp,
  TrendingDown,
} from "lucide-react";

interface SignalsTableProps {
  signals: SignalWithBot[];
}

export function SignalsTable({ signals }: SignalsTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [actionFilter, setActionFilter] = useState<string>("ALL");

  // Filter signals based on search and filters
  const filteredSignals = signals.filter((signal) => {
    const matchesSearch =
      signal.botName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      signal.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (signal.message?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);

    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "PROCESSED" && signal.processed) ||
      (statusFilter === "PENDING" && !signal.processed && !signal.error) ||
      (statusFilter === "ERROR" && signal.error);

    const matchesAction = actionFilter === "ALL" || signal.action === actionFilter;

    return matchesSearch && matchesStatus && matchesAction;
  });

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getActionBadge = (action: string) => {
    const configs: Record<string, { label: string; className: string; Icon: any }> = {
      ENTER_LONG: {
        label: "Enter Long",
        className: "bg-green-500/10 text-green-600 border-green-200",
        Icon: TrendingUp,
      },
      EXIT_LONG: {
        label: "Exit Long",
        className: "bg-green-500/10 text-green-700 border-green-300",
        Icon: TrendingDown,
      },
      ENTER_SHORT: {
        label: "Enter Short",
        className: "bg-red-500/10 text-red-600 border-red-200",
        Icon: TrendingDown,
      },
      EXIT_SHORT: {
        label: "Exit Short",
        className: "bg-red-500/10 text-red-700 border-red-300",
        Icon: TrendingUp,
      },
    };

    const config = configs[action] || {
      label: action,
      className: "bg-slate-500/10 text-slate-600 border-slate-200",
      Icon: Radio,
    };

    const Icon = config.Icon;
    return (
      <Badge className={`${config.className} border font-medium`}>
        <Icon className="size-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getStatusIcon = (signal: SignalWithBot) => {
    if (signal.processed) {
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    }
    if (signal.error) {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
    return <Clock className="h-4 w-4 text-yellow-500" />;
  };

  const stats = {
    total: signals.length,
    processed: signals.filter((s) => s.processed).length,
    pending: signals.filter((s) => !s.processed && !s.error).length,
    error: signals.filter((s) => s.error).length,
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-slate-200 shadow-sm rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Signals</p>
                <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
              </div>
              <div className="p-2 bg-teal-50 rounded-lg">
                <Radio className="h-5 w-5 text-teal-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Processed</p>
                <p className="text-2xl font-bold text-green-600">{stats.processed}</p>
              </div>
              <div className="p-2 bg-green-50 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <div className="p-2 bg-yellow-50 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Errors</p>
                <p className="text-2xl font-bold text-red-600">{stats.error}</p>
              </div>
              <div className="p-2 bg-red-50 rounded-lg">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-slate-200 shadow-md rounded-xl">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1 md:max-w-sm">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search by bot, symbol, or message..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 border-slate-200 focus:border-teal-300 focus:ring-teal-200"
              />
            </div>

            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] border-slate-200">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="PROCESSED">Processed</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="ERROR">Error</SelectItem>
                </SelectContent>
              </Select>

              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-[140px] border-slate-200">
                  <SelectValue placeholder="Action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Actions</SelectItem>
                  <SelectItem value="ENTER_LONG">Enter Long</SelectItem>
                  <SelectItem value="EXIT_LONG">Exit Long</SelectItem>
                  <SelectItem value="ENTER_SHORT">Enter Short</SelectItem>
                  <SelectItem value="EXIT_SHORT">Exit Short</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Signals Table */}
      <Card className="border-slate-200 shadow-md rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <Bot className="h-5 w-5 text-teal-600" />
            Your Signals ({filteredSignals.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredSignals.length === 0 ? (
            <div className="text-center py-12">
              <Bot className="h-12 w-12 mx-auto text-slate-400 mb-4 opacity-20" />
              <p className="text-sm font-medium text-slate-600">
                {signals.length === 0 ? "No signals yet" : "No signals match your filters"}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {signals.length === 0
                  ? "Bot signals will appear here when they are created"
                  : "Try adjusting your search or filters"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSignals.map((signal) => (
                <div
                  key={signal.id}
                  className="p-4 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        {getActionBadge(signal.action)}
                        <span className="font-semibold text-slate-900 text-lg">
                          {signal.symbol}
                        </span>
                        {getStatusIcon(signal)}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Bot</p>
                          <p className="text-sm font-medium text-slate-900 flex items-center gap-1">
                            <Bot className="h-3 w-3" />
                            {signal.botName}
                          </p>
                        </div>

                        {signal.price && (
                          <div>
                            <p className="text-xs text-slate-500 mb-1">Price</p>
                            <p className="text-sm font-medium text-slate-900">
                              ${signal.price.toFixed(2)}
                            </p>
                          </div>
                        )}

                        <div>
                          <p className="text-xs text-slate-500 mb-1">Created</p>
                          <p className="text-sm font-medium text-slate-900">
                            {formatDate(signal.createdAt)}
                          </p>
                        </div>

                        {signal.updatedAt !== signal.createdAt && (
                          <div>
                            <p className="text-xs text-slate-500 mb-1">Updated</p>
                            <p className="text-sm font-medium text-slate-900">
                              {formatDate(signal.updatedAt)}
                            </p>
                          </div>
                        )}
                      </div>

                      {signal.message && (
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Message</p>
                          <p className="text-sm text-slate-700 italic">{signal.message}</p>
                        </div>
                      )}

                      {signal.error && (
                        <div>
                          <p className="text-xs text-red-500 mb-1 font-medium">Error</p>
                          <p className="text-sm text-red-600">{signal.error}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

