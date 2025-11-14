"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import { ConnectExchangeDialog } from './connect-exchange-dialog';
import { Exchange } from '@/types/exchange';
import { UserWithAgent } from '@/db/actions/admin/get-all-users';
import { useSelectedUser } from '@/contexts/selected-user-context';

interface ExchangeHeaderProps {
  onExchangeAdded: (exchange: Exchange) => void;
  selectedUser: UserWithAgent;
}

export function ExchangeHeader({ onExchangeAdded, selectedUser }: ExchangeHeaderProps) {
  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const { refreshSelectedUser } = useSelectedUser();

  const handleExchangeAdded = async (exchange: Exchange) => {
    onExchangeAdded(exchange);
    setShowConnectDialog(false);
    // Refresh selected user data to update portfolio status
    await refreshSelectedUser();
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
