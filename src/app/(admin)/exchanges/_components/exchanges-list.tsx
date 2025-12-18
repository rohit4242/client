"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog } from "@/components/ui/dialog";
import { RefreshCw } from "lucide-react";
import { ExchangeCard } from "./exchange-card";
import { ConnectExchangeDialog } from "./connect-exchange-dialog";
import {
  useSyncExchangeMutation,
  useUpdateExchangeMutation,
  useDeleteExchangeMutation,
  type ExchangeClient,
} from "@/features/exchange";

interface ExchangesListProps {
  exchanges: ExchangeClient[];
}

export function ExchangesList({
  exchanges,
}: ExchangesListProps) {
  const [editingExchange, setEditingExchange] = useState<ExchangeClient | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  // React Query mutations
  const syncMutation = useSyncExchangeMutation();
  const updateMutation = useUpdateExchangeMutation();
  const deleteMutation = useDeleteExchangeMutation();

  const handleSync = (exchangeId: string) => {
    syncMutation.mutate({ id: exchangeId });
  };

  const handleToggleActive = (
    exchangeId: string,
    currentStatus: boolean
  ) => {
    updateMutation.mutate({
      id: exchangeId,
      isActive: !currentStatus,
    });
  };

  const handleDelete = (exchangeId: string) => {
    if (!confirm("Are you sure you want to delete this exchange?")) return;

    deleteMutation.mutate({ id: exchangeId });
  };

  const handleEdit = (exchange: ExchangeClient) => {
    setEditingExchange(exchange);
    setShowEditDialog(true);
  };

  const handleExchangeUpdated = () => {
    setShowEditDialog(false);
    setEditingExchange(null);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Connected Exchanges ({exchanges.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Exchange</TableHead>
                <TableHead>Account Name</TableHead>
                <TableHead>API Key</TableHead>
                <TableHead>Total USD Value</TableHead>
                <TableHead>Last Synced</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exchanges.map((exchange) => (
                <ExchangeCard
                  key={exchange.id}
                  exchange={exchange}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onToggleActive={handleToggleActive}
                  onSync={handleSync}
                />
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <ConnectExchangeDialog
          exchange={editingExchange}
          onSuccess={handleExchangeUpdated}
          onClose={() => {
            setShowEditDialog(false);
            setEditingExchange(null);
          }}
        />
      </Dialog>
    </>
  );
}
