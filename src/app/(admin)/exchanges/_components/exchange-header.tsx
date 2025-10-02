"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import { ConnectExchangeDialog } from './connect-exchange-dialog';
import { Exchange } from '@/types/exchange';
import { Customer } from '@/db/actions/admin/get-customers';

interface ExchangeHeaderProps {
  onExchangeAdded: (exchange: Exchange) => void;
  selectedUser: Customer;
}

export function ExchangeHeader({ onExchangeAdded, selectedUser }: ExchangeHeaderProps) {
  const [showConnectDialog, setShowConnectDialog] = useState(false);

  const handleExchangeAdded = (exchange: Exchange) => {
    onExchangeAdded(exchange);
    setShowConnectDialog(false);
  };

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold">Exchange Accounts</h1>
        <p className="text-muted-foreground mt-1">
          Managing exchanges for {selectedUser.name} ({selectedUser.email})
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
          userId={selectedUser.id}
        />
      </Dialog>
    </div>
  );
}
