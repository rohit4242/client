"use client";

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
  Copy
} from 'lucide-react';
import { toast } from 'sonner';
import { Exchange } from '@/types/exchange';

interface ExchangeCardProps {
  exchange: Exchange;
  onEdit: (exchange: Exchange) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string, isActive: boolean) => void;
  onSync: (id: string) => void;
  syncing?: string | null;
}

export function ExchangeCard({ 
  exchange, 
  onEdit, 
  onDelete, 
  onToggleActive, 
  onSync,
  syncing 
}: ExchangeCardProps) {
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
        <div className="font-medium">
          {formatCurrency(exchange.totalValue)}
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
            disabled={syncing === exchange.id}
          >
            <RefreshCw 
              className={`w-4 h-4 ${syncing === exchange.id ? 'animate-spin' : ''}`} 
            />
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
        </div>
      </TableCell>
    </TableRow>
  );
}
