"use client";

import { useState, useEffect } from 'react';
import { Exchange } from '@/types/exchange';
import { ExchangeHeader } from './exchange-header';
import { ExchangesList } from './exchanges-list';
import { EmptyState } from './empty-state';
import { Customer } from '@/db/actions/admin/get-customers';
import { getExchangesForUser } from '@/db/actions/admin/get-exchanges-for-user';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

interface ExchangesClientProps {
  selectedUser: Customer;
}

export function ExchangesClient({ selectedUser }: ExchangesClientProps) {
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadExchanges() {
      setLoading(true);
      const data = await getExchangesForUser(selectedUser.id);
      setExchanges(data);
      setLoading(false);
    }
    loadExchanges();
  }, [selectedUser.id]);

  const handleExchangeAdded = (newExchange: Exchange) => {
    setExchanges(prev => [newExchange, ...prev]);
  };

  const handleExchangesChange = (updatedExchanges: Exchange[]) => {
    setExchanges(updatedExchanges);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Exchange Accounts</h1>
          <p className="text-muted-foreground">
            Managing exchanges for {selectedUser.name}
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
      <ExchangeHeader 
        onExchangeAdded={handleExchangeAdded}
        selectedUser={selectedUser}
      />
      
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
          onExchangesChange={handleExchangesChange}
          selectedUser={selectedUser}
        />
      )}
    </div>
  );
}
