"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { BotWithExchange, useDeleteBotMutation } from "@/features/signal-bot";
import { cn } from "@/lib/utils";

interface DeleteSignalBotDialogProps {
  bot: BotWithExchange;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function DeleteSignalBotDialog({ bot, open, onOpenChange, onSuccess }: DeleteSignalBotDialogProps) {
  const deleteBotMutation = useDeleteBotMutation();

  const handleDelete = async () => {
    try {
      await deleteBotMutation.mutateAsync({ id: bot.id });
      onSuccess();
    } catch (error) {
      // Error handled by mutation hook
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="p-0 overflow-hidden border-none shadow-2xl bg-slate-50 max-w-md">
        <div className="p-5 bg-white border-b border-slate-100">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold">Delete Signal Bot</AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-medium">
              Are you sure you want to delete &quot;{bot.name}&quot;?
            </AlertDialogDescription>
          </AlertDialogHeader>
        </div>

        <div className="p-5 space-y-4">
          <div className="rounded-xl border border-slate-200/60 bg-white p-4 space-y-3 shadow-sm">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Bot Intelligence Details</div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <div className="text-[10px] text-slate-500 uppercase font-bold">Identifier</div>
                <div className="font-mono font-bold text-slate-900 truncate">{bot.name}</div>
              </div>
              <div className="space-y-1">
                <div className="text-[10px] text-slate-500 uppercase font-bold">Assets</div>
                <div className="font-mono font-bold text-slate-900">{bot.symbols.join(', ')}</div>
              </div>
              <div className="space-y-1">
                <div className="text-[10px] text-slate-500 uppercase font-bold">Activity</div>
                <div className="font-mono font-bold text-slate-900">{bot.totalTrades} Trades</div>
              </div>
              <div className="space-y-1">
                <div className="text-[10px] text-slate-500 uppercase font-bold">Bot Status</div>
                <div className="flex items-center gap-1.5">
                  <div className={cn("size-1.5 rounded-full", bot.isActive ? "bg-emerald-500 animate-pulse" : "bg-slate-300")} />
                  <span className="font-bold text-slate-900">{bot.isActive ? "ACTIVE" : "INACTIVE"}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-amber-50 border border-amber-100 flex items-start gap-3">
            <span className="mt-0.5">⚠️</span>
            <div className="text-xs text-amber-800 leading-relaxed font-medium">
              This will permanently remove the bot and all associated history. This operation is <strong>irreversible</strong>.
            </div>
          </div>
        </div>

        <AlertDialogFooter className="p-5 bg-white border-t border-slate-100 flex items-center justify-between sm:justify-between">
          <AlertDialogCancel
            disabled={deleteBotMutation.isPending}
            className="h-11 px-6 rounded-xl font-bold text-slate-400 border-none hover:bg-slate-50 hover:text-slate-900"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteBotMutation.isPending}
            className="h-11 px-6 rounded-xl font-black uppercase tracking-widest text-[10px] bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-100 border-none"
          >
            {deleteBotMutation.isPending ? "DELETING..." : "CONFIRM DELETE"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
