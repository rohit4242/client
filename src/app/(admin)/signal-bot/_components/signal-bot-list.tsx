"use client";

import { SignalBot } from "@/types/signal-bot";
import { SignalBotCard } from "@/components/signal-bot/bot-card";

interface SignalBotListProps {
  signalBots: SignalBot[];
  onBotUpdated: () => void;
}

export function SignalBotList({ signalBots, onBotUpdated }: SignalBotListProps) {
  return (
    <div className="space-y-4">
      {signalBots.map((bot) => (
        <SignalBotCard
          key={bot.id}
          bot={bot}
          onBotUpdated={onBotUpdated}
        />
      ))}
    </div>
  );
}
