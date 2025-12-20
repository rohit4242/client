"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Bot as BotIcon } from "lucide-react";
import { BotWithExchange, CreateBotForm } from "@/features/signal-bot";
import { PositionConfirmationDialog } from "@/app/(admin)/signal-bot/_components/dialogs/position-confirmation-dialog";

interface CreateSignalBotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateSignalBotDialog({ open, onOpenChange, onSuccess }: CreateSignalBotDialogProps) {
  const [createdBot, setCreatedBot] = useState<BotWithExchange | null>(null);
  const [showPositionDialog, setShowPositionDialog] = useState(false);

  const handleSuccess = (bot: BotWithExchange) => {
    setCreatedBot(bot);
    setShowPositionDialog(true);
  };

  const handlePositionDialogComplete = () => {
    setShowPositionDialog(false);
    setCreatedBot(null);
    onSuccess();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden border-none shadow-2xl bg-slate-50">
          <div className="p-5 bg-white border-b border-slate-100">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-teal-50 rounded-xl">
                  <BotIcon className="h-5 w-5 text-teal-600" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold">Create Signal Bot</DialogTitle>
                  <DialogDescription>
                    Set up a trading bot that responds to TradingView signals.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
          </div>

          <CreateBotForm
            open={open}
            onOpenChange={onOpenChange}
            onSuccess={handleSuccess}
          />
        </DialogContent>
      </Dialog >

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

