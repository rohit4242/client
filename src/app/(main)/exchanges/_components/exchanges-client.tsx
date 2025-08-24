"use client";

import { useState } from 'react';
import { Exchange } from '@/types/exchange';
import { ExchangeHeader } from './exchange-header';
import { ExchangesList } from './exchanges-list';
import { EmptyState } from './empty-state';

interface ExchangesClientProps {
  initialExchanges: Exchange[];
}

export function ExchangesClient({ initialExchanges }: ExchangesClientProps) {
  const [exchanges, setExchanges] = useState<Exchange[]>(initialExchanges);

  const handleExchangeAdded = (newExchange: Exchange) => {
    setExchanges(prev => [newExchange, ...prev]);
  };

  const handleExchangesChange = (updatedExchanges: Exchange[]) => {
    setExchanges(updatedExchanges);
  };

  return (
    <div className="space-y-6">
      <ExchangeHeader onExchangeAdded={handleExchangeAdded} />
      
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
        />
      )}
    </div>
  );
}
