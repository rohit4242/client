"use client";

import { useState, } from "react";
import { SignalBotList } from "./signal-bot-list";
import { SignalBotHeader } from "./signal-bot-header";
import { CreateBotDialog } from "@/app/(admin)/signal-bot/_components/dialogs/create-bot-dialog";
import { SignalBotStats } from "./signal-bot-stats";
import { EmptyState } from "./empty-state";
import { SignalBotLoading } from "./signal-bot-loading";
import {
  useBotsQuery,
  useBotsStatsQuery,
  type BotWithExchange
} from "@/features/signal-bot";

interface SignalBotClientProps {
  selectedUser: any;
}

export function SignalBotClient({ selectedUser }: SignalBotClientProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const {
    data: botsData,
    isLoading: isBotsLoading,
    refetch,
  } = useBotsQuery({
    userId: selectedUser.id,
  });

  const {
    data: statsData,
    isLoading: isStatsLoading,
  } = useBotsStatsQuery({
    userId: selectedUser.id,
  });

  const signalBots = botsData?.bots || [];
  const isLoading = isBotsLoading || isStatsLoading;

  const handleBotCreated = () => {
    setShowCreateDialog(false);
    refetch();
  };

  const handleBotUpdated = () => {
    refetch();
  };

  if (isLoading) {
    return <SignalBotLoading />;
  }

  if (signalBots.length === 0) {
    return (
      <>
        <EmptyState onCreateBot={() => setShowCreateDialog(true)} />
        <CreateBotDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onSuccess={handleBotCreated}
          userId={selectedUser.id}
        />
      </>
    );
  }

  const activeBotsCount = signalBots.filter(b => b.isActive).length;

  return (
    <div className="space-y-6">
      <SignalBotHeader
        totalBots={signalBots.length}
        activeBots={activeBotsCount}
        onCreateBot={() => setShowCreateDialog(true)}
      />

      <SignalBotStats stats={statsData?.data} />

      <SignalBotList
        signalBots={signalBots}
        onBotUpdated={handleBotUpdated}
      />

      {/* Create Bot Dialog - Integrated as backup */}
      <CreateBotDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={handleBotCreated}
        userId={selectedUser.id}
      />
    </div>
  );
}
