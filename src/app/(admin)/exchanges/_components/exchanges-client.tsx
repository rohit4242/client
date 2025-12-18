"use client";

import { useExchangesQuery } from '@/features/exchange';
import { ExchangeHeader } from './exchange-header';
import { ExchangesList } from './exchanges-list';
import { EmptyState } from './empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

export function ExchangesClient() {
  const { data, isLoading } = useExchangesQuery();
  const exchanges = data?.exchanges ?? [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Exchange Accounts</h1>
          <p className="text-muted-foreground">
            Manage your exchange connections
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-8 w-32 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ExchangeHeader />

      {exchanges.length === 0 ? (
        <EmptyState
          onConnectExchange={() => {
            // Trigger the dialog in the header
            const addButton = document.querySelector('[data-testid="add-exchange-btn"]') as HTMLButtonElement;
            addButton?.click();
          }}
        />
      ) : (
        <ExchangesList
          exchanges={exchanges}
        />
      )}
    </div>
  );
}
