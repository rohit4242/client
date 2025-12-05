"use client";

import { useState, } from "react";
import { SignalBotList } from "./signal-bot-list";
import { CreateSignalBotDialog } from "@/components/signal-bot/dialogs/create-bot-dialog";
import { SignalBotHeader } from "./signal-bot-header";
import { SignalBotStats } from "./signal-bot-stats";
import { EmptyState } from "./empty-state";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { SignalBot } from "@/types/signal-bot";
import { UserWithAgent } from "@/db/actions/admin/get-all-users";
import { useSelectedUser } from "@/contexts/selected-user-context";

interface SignalBotClientProps {
  selectedUser: UserWithAgent;
}

export function SignalBotClient({ selectedUser }: SignalBotClientProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { refreshSelectedUser } = useSelectedUser();

  const {
    data: signalBots = [],
    isLoading,
    refetch,
  } = useQuery<SignalBot[]>({
    queryKey: ["signal-bots", selectedUser.id],
    queryFn: async () => {
      const response = await axios.get("/api/signal-bots");
      return response.data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds for real-time stats
    staleTime: 10000, // Consider data stale after 10 seconds
  });

  const activeBots = signalBots.filter(bot => bot.isActive);
  const totalTrades = signalBots.reduce((sum, bot) => sum + bot.totalTrades, 0);
  const totalPnl = signalBots.reduce((sum, bot) => sum + bot.totalPnl, 0);

  // Calculate proper aggregated win rate from actual wins/losses
  const totalWins = signalBots.reduce((sum, bot) => sum + (bot.winTrades || 0), 0);
  const winRate = totalTrades > 0 ? (totalWins / totalTrades) * 100 : 0;

  const handleBotCreated = async () => {
    setShowCreateDialog(false);
    refetch();
    // Refresh selected user data to update portfolio status
    await refreshSelectedUser();
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
        winRate={winRate}
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
