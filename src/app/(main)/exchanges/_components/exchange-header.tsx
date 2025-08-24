"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import { ConnectExchangeDialog } from './connect-exchange-dialog';
import { Exchange } from '@/types/exchange';

interface ExchangeHeaderProps {
  onExchangeAdded: (exchange: Exchange) => void;
}

export function ExchangeHeader({ onExchangeAdded }: ExchangeHeaderProps) {
  const [showConnectDialog, setShowConnectDialog] = useState(false);

  const handleExchangeAdded = (exchange: Exchange) => {
    onExchangeAdded(exchange);
    setShowConnectDialog(false);
  };

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold">My Exchanges</h1>
        <p className="text-muted-foreground mt-1">
          Manage your exchange connections and trading accounts
        </p>
      </div>
      <Dialog open={showConnectDialog} onOpenChange={setShowConnectDialog}>
        <DialogTrigger asChild>
          <Button data-testid="add-exchange-btn">
            <Plus className="w-4 h-4 mr-2" />
            Add Exchange
          </Button>
        </DialogTrigger>
        <ConnectExchangeDialog 
          onSuccess={handleExchangeAdded}
          onClose={() => setShowConnectDialog(false)}
        />
      </Dialog>
    </div>
  );
}
