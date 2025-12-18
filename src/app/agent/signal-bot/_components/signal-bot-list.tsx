"use client";

import { SignalBotCard } from "./bot-card";
import { type BotWithExchange } from "@/features/signal-bot";

interface SignalBotListProps {
  signalBots: BotWithExchange[];
  onBotUpdated?: () => void;
}

export function SignalBotList({ signalBots, onBotUpdated }: SignalBotListProps) {
  return (
    <div className="grid gap-6 grid-cols-1 xl:grid-cols-2">
      {signalBots.map((bot) => (
        <SignalBotCard
          key={bot.id}
          bot={bot}
        />
      ))}
    </div>
  );
}
