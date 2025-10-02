"use client";

import { useSelectedUser } from "@/contexts/selected-user-context";
import { NoUserSelected } from "../_components/no-user-selected";
import { ExchangesClient } from './_components/exchanges-client';

export default function ExchangesPage() {
  const { selectedUser } = useSelectedUser();

  if (!selectedUser) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Exchange Accounts</h1>
          <p className="text-muted-foreground">
            Connect and manage exchange accounts
          </p>
        </div>
        <NoUserSelected />
      </div>
    );
  }

  return <ExchangesClient selectedUser={selectedUser} />;
}