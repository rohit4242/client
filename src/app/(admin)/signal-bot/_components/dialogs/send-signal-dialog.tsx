"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Zap,
  Target,
  MessageSquare,
  BarChart3,
  ArrowUpCircle,
  ArrowDownCircle,
  Plus
} from "lucide-react";
import {
  useCreateSignalMutation,
  type BotWithExchange,
} from "@/features/signal-bot";
import { Action } from "@prisma/client";
import { Badge } from "@/components/ui/badge";

interface CreateSignalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  bots: BotWithExchange[];
  onSuccess: () => void;
}

export function CreateSignalDialog({
  open,
  onOpenChange,
  userId,
  bots,
  onSuccess,
}: CreateSignalDialogProps) {
  const [botId, setBotId] = useState("");
  const [action, setAction] = useState<Action>(Action.ENTER_LONG);
  const [symbol, setSymbol] = useState("");
  const [price, setPrice] = useState("");
  const [message, setMessage] = useState("");

  const createMutation = useCreateSignalMutation();

  const handleCreate = () => {
    if (!botId || !symbol.trim()) return;

    createMutation.mutate({
      botId,
      action,
      symbol: symbol.toUpperCase(),
      price: price ? parseFloat(price) : null,
      message: message.trim() || null,
    }, {
      onSuccess: () => {
        handleReset();
        onOpenChange(false);
        onSuccess();
      }
    });
  };

  const handleReset = () => {
    setBotId("");
    setAction(Action.ENTER_LONG);
    setSymbol("");
    setPrice("");
    setMessage("");
  };

  const isLoading = createMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 overflow-hidden border-none shadow-2xl bg-slate-50 dark:bg-slate-950">
        <div className="p-6 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl">
                <Plus className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold">Manual Signal Dispatch</DialogTitle>
                <DialogDescription>
                  Inject a direct trading command into the bot execution pipeline
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-6">
          {/* Bot Selection */}
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Select Execution Engine</Label>
            <Select value={botId} onValueChange={setBotId}>
              <SelectTrigger className="h-12 rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm focus:ring-indigo-500">
                <SelectValue placeholder="Choose an active signal bot" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-xl">
                {bots.map((bot) => (
                  <SelectItem key={bot.id} value={bot.id} className="rounded-xl py-3 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <div className="size-2 rounded-full bg-emerald-500" />
                      <span className="font-bold">{bot.name}</span>
                      <Badge variant="outline" className="text-[9px] font-black uppercase tracking-tighter ml-2 bg-slate-50">
                        {bot.symbols.join(", ")}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Symbol & Price */}
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Asset Symbol</Label>
              <div className="relative">
                <Target className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <Input
                  className="pl-11 h-12 rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm focus:ring-indigo-500 font-bold placeholder:font-medium uppercase"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  placeholder="e.g. BTCUSDT"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Execution Price</Label>
              <div className="relative">
                <BarChart3 className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <Input
                  type="number"
                  className="pl-11 h-12 rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm focus:ring-indigo-500 font-bold placeholder:font-medium"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Market Price if empty"
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          {/* Action Choice */}
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Signal Intent</Label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: Action.ENTER_LONG, label: "Enter Long", icon: ArrowUpCircle, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-100" },
                { id: Action.EXIT_LONG, label: "Exit Long", icon: ArrowDownCircle, color: "text-emerald-400", bg: "bg-slate-50 border-slate-100" },
                { id: Action.ENTER_SHORT, label: "Enter Short", icon: ArrowDownCircle, color: "text-rose-600", bg: "bg-rose-50 border-rose-100" },
                { id: Action.EXIT_SHORT, label: "Exit Short", icon: ArrowUpCircle, color: "text-rose-400", bg: "bg-slate-50 border-slate-100" },
              ].map((act) => (
                <div
                  key={act.id}
                  className={`
                    flex items-center gap-3 p-4 rounded-2xl border-2 transition-all cursor-pointer shadow-sm
                    ${action === act.id ? `ring-2 ring-indigo-500 ${act.bg}` : "border-slate-100 bg-white hover:border-slate-200"}
                  `}
                  onClick={() => setAction(act.id as Action)}
                >
                  <act.icon className={`size-5 ${act.color}`} />
                  <span className={`text-xs font-black uppercase tracking-tight ${action === act.id ? "text-slate-900" : "text-slate-500"}`}>
                    {act.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">External Payload (Optional)</Label>
            <div className="relative">
              <MessageSquare className="absolute left-4 top-4 size-4 text-slate-400" />
              <Textarea
                className="pl-11 min-h-[100px] rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm focus:ring-indigo-500 font-medium pt-3"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Attach custom data or notes to this signal..."
                disabled={isLoading}
              />
            </div>
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="h-12 px-6 rounded-xl font-bold text-slate-400 hover:text-slate-900"
            disabled={isLoading}
          >
            Abort
          </Button>

          <Button
            onClick={handleCreate}
            disabled={isLoading || !botId || !symbol.trim()}
            className="h-12 px-8 rounded-xl font-black uppercase tracking-widest text-[10px] bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-200"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="size-3 rounded-full border-2 border-slate-600 border-t-white animate-spin" />
                Dispatching...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Zap className="size-3 fill-current" />
                Dispatch Signal
              </div>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

