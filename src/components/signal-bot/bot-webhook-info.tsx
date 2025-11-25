"use client";

import { SignalBot } from "@/types/signal-bot";
import { WebhookInfoDialog } from "./dialogs/webhook-info-dialog";

interface BotWebhookInfoProps {
  bot: SignalBot;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BotWebhookInfo({ bot, open, onOpenChange }: BotWebhookInfoProps) {
  return (
    <WebhookInfoDialog
      bot={bot}
      open={open}
      onOpenChange={onOpenChange}
    />
  );
}
