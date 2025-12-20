"use client";

import { BotWithExchange } from "@/features/signal-bot";
import { SignalBotCard } from "./cards/signal-bot-card";
import { SignalBotListItem } from "./cards/signal-bot-list-item";
import { cn } from "@/lib/utils";

interface SignalBotListProps {
  signalBots: BotWithExchange[];
  onBotUpdated: () => void;
  userId: string;
  viewMode: 'grid' | 'list';
}

export function SignalBotList({ signalBots, onBotUpdated, userId, viewMode }: SignalBotListProps) {
  return (
    <div className={cn(
      "grid gap-3",
      viewMode === 'grid'
        ? signalBots.length === 1
          ? "grid-cols-1"
          : signalBots.length === 2
            ? "grid-cols-1 md:grid-cols-2"
            : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
        : "grid-cols-1"
    )}>
      {signalBots.map((bot) => (
        viewMode === 'grid' ? (
          <SignalBotCard
            key={bot.id}
            bot={bot}
            onBotUpdated={onBotUpdated}
            userId={userId}
          />
        ) : (
          <SignalBotListItem
            key={bot.id}
            bot={bot}
            onBotUpdated={onBotUpdated}
            userId={userId}
          />
        )
      ))}
    </div>
  );
}
