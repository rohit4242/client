"use client";

import { useState } from "react";
import {
  SignalBotHeader,
  SignalBotStats,
  SignalBotList,
  SignalBotLoading,
  SignalBotEmptyState,
  SignalBotErrorState
} from "./index";
import { CreateSignalBotDialog } from "./dialogs/create-bot-dialog";
import { useBotsQuery, useBotsStatsQuery } from "@/features/signal-bot";
import { useSelectedUser } from "@/contexts/selected-user-context";

interface SignalBotClientProps {
  userId: string;
}

export function SignalBotClient({ userId }: SignalBotClientProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { selectedUser, refreshSelectedUser } = useSelectedUser();

  const {
    data: botsData,
    isLoading: isBotsLoading,
    isFetching: isBotsFetching,
    error: botsError,
    refetch: refetchBots,
  } = useBotsQuery({ userId });

  const {
    data: statsData,
    isLoading: isStatsLoading,
    isFetching: isStatsFetching,
    error: statsError,
    refetch: refetchStats,
  } = useBotsStatsQuery({ userId });

  const signalBots = botsData?.bots ?? [];
  const isLoading = (isBotsLoading || isStatsLoading) && signalBots.length === 0;
  const isRefreshing = isBotsFetching || isStatsFetching;
  const isError = !!botsError || !!statsError;

  const handleRefresh = async () => {
    refetchBots();
    refetchStats();
    await refreshSelectedUser();
  };

  const handleBotCreated = async () => {
    setShowCreateDialog(false);
    handleRefresh();
  };

  const handleBotUpdated = () => {
    refetchBots();
    refetchStats();
  };

  if (isLoading) {
    return <SignalBotLoading />;
  }

  if (isError) {
    return <SignalBotErrorState
      error={(botsError || statsError) as Error}
      reset={handleRefresh}
    />;
  }

  // Common Header Props
  const header = (
    <SignalBotHeader
      totalBots={statsData?.totalBots ?? 0}
      activeBots={statsData?.activeBots ?? 0}
      onCreateBot={() => setShowCreateDialog(true)}
      onRefresh={handleRefresh}
      isRefreshing={isRefreshing}
      userName={selectedUser?.name ?? undefined}
      viewMode={viewMode}
      onViewModeChange={setViewMode}
    />
  );

  if (signalBots.length === 0 && !isBotsLoading) {
    return (
      <div className="space-y-6">
        {header}
        <SignalBotEmptyState onCreateBot={() => setShowCreateDialog(true)} />
        <CreateSignalBotDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onSuccess={handleBotCreated}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20">
      {header}

      <div className="space-y-6 mt-4">
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-slate-800">Performance Overview</h2>
          </div>
          <SignalBotStats stats={statsData} />
        </section>

        <section>
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
            <h2 className="text-xl font-semibold text-slate-800">Active Bots</h2>
            <p className="text-sm text-slate-500 font-medium">
              Showing {signalBots.length} registered bots
            </p>
          </div>
          <SignalBotList
            signalBots={signalBots}
            onBotUpdated={handleBotUpdated}
            userId={userId}
            viewMode={viewMode}
          />
        </section>
      </div>

      <CreateSignalBotDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={handleBotCreated}
      />
    </div>
  );
}
