"use client";

import { useState } from "react";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { TableCell, TableRow } from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MoreHorizontal,
  RefreshCw,
  Edit,
  Trash2,
  Copy,
  Wallet
} from 'lucide-react';
import { toast } from 'sonner';
import { type ExchangeClient } from '@/features/exchange';
import { AccountBalances } from '@/components/trading/account-balances';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface ExchangeCardProps {
  exchange: ExchangeClient;
  onEdit: (exchange: ExchangeClient) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string, isActive: boolean) => void;
  onSync: (id: string) => void;
}

export function ExchangeCard({
  exchange,
  onEdit,
  onDelete,
  onToggleActive,
  onSync,
}: ExchangeCardProps) {
  const [showBalanceDialog, setShowBalanceDialog] = useState(false);

  const copyApiKey = (apiKey: string) => {
    navigator.clipboard.writeText(apiKey);
    toast.success("API key copied to clipboard");
  };

  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return "N/A";
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "Never";
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  return (
    <TableRow key={exchange.id}>
      <TableCell>
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-orange-500 rounded flex items-center justify-center">
            <span className="text-white font-bold text-sm">
              {exchange.name[0]}
            </span>
          </div>
          <div>
            <div className="font-medium">{exchange.name}</div>
            <div className="flex items-center space-x-1">
              <Badge variant="outline" className="text-xs">
                {exchange.positionMode}
              </Badge>
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell className="font-medium">
        {exchange.name || "N/A"}
      </TableCell>
      <TableCell>
        <div className="flex items-center space-x-2">
          <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
            {exchange.apiKey.substring(0, 8)}...
          </code>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => copyApiKey(exchange.apiKey)}
          >
            <Copy className="w-3 h-3" />
          </Button>
        </div>
      </TableCell>
      <TableCell>
        <div className="space-y-1">
          <div className="font-medium">
            {formatCurrency(exchange.totalValue)}
          </div>
          <div className="flex gap-2 text-xs text-muted-foreground">
            <span>Spot: {formatCurrency(exchange.spotValue)}</span>
            <span>•</span>
            <span>Margin: {formatCurrency(exchange.marginValue)}</span>
          </div>
        </div>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {formatDate(exchange.lastSyncedAt ? new Date(exchange.lastSyncedAt) : null)}
      </TableCell>
      <TableCell>
        <div className="flex items-center space-x-2">
          <Switch
            checked={exchange.isActive}
            onCheckedChange={() =>
              onToggleActive(exchange.id, exchange.isActive)
            }
          />
          <span className="text-sm">
            {exchange.isActive ? 'Enabled' : 'Disabled'}
          </span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSync(exchange.id)}
            title="Sync Exchange"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowBalanceDialog(true)}
            title="View Balances"
          >
            <Wallet className="w-4 h-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => onEdit(exchange)}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(exchange.id)}
                className="text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Dialog open={showBalanceDialog} onOpenChange={setShowBalanceDialog}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Account Balances - {exchange.name}</DialogTitle>
              </DialogHeader>
              <AccountBalances exchange={exchange} />
            </DialogContent>
          </Dialog>
        </div>
      </TableCell>
    </TableRow>
  );
}
