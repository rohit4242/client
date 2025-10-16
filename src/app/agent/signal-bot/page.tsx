"use client";

import { Suspense } from "react";
import { SignalBotClient } from "./_components/signal-bot-client";
import { SignalBotLoading } from "./_components/signal-bot-loading";
import { useSelectedUser } from "@/contexts/selected-user-context";
import { NoUserSelected } from "@/app/(admin)/_components/no-user-selected";

export default function SignalBotPage() {
  const { selectedUser } = useSelectedUser();

  if (!selectedUser) {
    return (
      <div className="flex flex-col h-full">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Signal Bot</h1>
          <p className="text-muted-foreground">
            Automated trading with TradingView signals and custom strategies
          </p>
        </div>
        <NoUserSelected />
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Signal Bot</h2>
          <p className="text-muted-foreground">
            Managing signal bots for {selectedUser.name} ({selectedUser.email})
          </p>
        </div>
      </div>

      <Suspense fallback={<SignalBotLoading />}>
        <SignalBotClient selectedUser={selectedUser} />
      </Suspense>
    </div>
  );
}
