"use client";

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SignalBotList } from "./signal-bot-list";
import { CreateSignalBotDialog } from "./create-signal-bot-dialog";
import { SignalBotHeader } from "./signal-bot-header";
import { SignalBotStats } from "./signal-bot-stats";
import { EmptyState } from "./empty-state";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { SignalBot } from "@/types/signal-bot";

export function SignalBotClient() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const {
    data: signalBots = [],
    isLoading,
    refetch,
  } = useQuery<SignalBot[]>({
    queryKey: ["signal-bots"],
    queryFn: async () => {
      const response = await axios.get("/api/signal-bots");
      return response.data;
    },
  });

  const activeBots = signalBots.filter(bot => bot.isActive);
  const totalTrades = signalBots.reduce((sum, bot) => sum + bot.totalTrades, 0);
  const totalPnl = signalBots.reduce((sum, bot) => sum + bot.totalPnl, 0);

  const handleBotCreated = () => {
    setShowCreateDialog(false);
    refetch();
  };

  const handleBotUpdated = () => {
    refetch();
  };

  if (isLoading) {
    return <div>Loading signal bots...</div>;
  }

  if (signalBots.length === 0) {
    return (
      <>
        <EmptyState onCreateBot={() => setShowCreateDialog(true)} />
        <CreateSignalBotDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onSuccess={handleBotCreated}
        />
      </>
    );
  }

  return (
    <div className="space-y-6">
      <SignalBotHeader
        totalBots={signalBots.length}
        activeBots={activeBots.length}
        onCreateBot={() => setShowCreateDialog(true)}
      />

      <SignalBotStats
        totalBots={signalBots.length}
        activeBots={activeBots.length}
        totalTrades={totalTrades}
        totalPnl={totalPnl}
      />

      <SignalBotList
        signalBots={signalBots}
        onBotUpdated={handleBotUpdated}
      />

      <CreateSignalBotDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={handleBotCreated}
      />
    </div>
  );
}
