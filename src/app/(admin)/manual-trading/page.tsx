"use client";

import { useSelectedUser } from "@/contexts/selected-user-context";
import { NoUserSelected } from "../_components/no-user-selected";
import ManualTradingView from "./_components/manual-trading-view";

export default function ManualTradingPage() {
  const { selectedUser } = useSelectedUser();

  if (!selectedUser) {
    return (
      <div className="flex flex-col h-full">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Manual Trading</h1>
          <p className="text-muted-foreground">
            Execute trades manually with real-time market data
          </p>
        </div>
        <NoUserSelected />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Manual Trading</h1>
        <p className="text-muted-foreground">
          Trading for {selectedUser.name} ({selectedUser.email})
        </p>
      </div>
      
      <div className="flex-1 min-h-0">
        <ManualTradingView selectedUser={selectedUser} />
      </div>
    </div>
  );
}