"use client";

import { Bot as BotIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EditBotForm, BotWithExchange } from "@/features/signal-bot";

interface EditSignalBotDialogProps {
  bot: BotWithExchange;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditSignalBotDialog({ bot, open, onOpenChange, onSuccess }: EditSignalBotDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden border-none shadow-2xl bg-white">
        <div className="p-5 bg-white border-b border-slate-100">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-50 rounded-xl text-teal-600">
                <BotIcon className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-slate-900 leading-tight">Edit Signal Bot</DialogTitle>
                <DialogDescription className="text-sm text-slate-500">
                  Update your bot configuration and trading settings.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <EditBotForm
          bot={bot}
          open={open}
          onOpenChange={onOpenChange}
          onSuccess={onSuccess}
        />
      </DialogContent>
    </Dialog>
  );
}
