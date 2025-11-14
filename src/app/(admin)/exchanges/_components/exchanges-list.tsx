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
import { toast } from "sonner";
import { Exchange } from "@/types/exchange";
import { ExchangeCard } from "./exchange-card";
import { ConnectExchangeDialog } from "./connect-exchange-dialog";
import axios from "axios";
import { UserWithAgent } from "@/db/actions/admin/get-all-users";

interface ExchangesListProps {
  exchanges: Exchange[];
  onExchangesChange: (exchanges: Exchange[]) => void;
  selectedUser: UserWithAgent;
}

export function ExchangesList({
  exchanges,
  onExchangesChange,
  selectedUser,
}: ExchangesListProps) {
  const [syncing, setSyncing] = useState<string | null>(null);
  const [editingExchange, setEditingExchange] = useState<Exchange | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const handleSync = async (exchangeId: string) => {
    setSyncing(exchangeId);
    try {
      const response = await axios.get(`/api/exchanges/${exchangeId}`);
      const data = response.data;
      const updatedExchanges = exchanges.map((ex) =>
        ex.id === exchangeId ? data : ex
      );
      onExchangesChange(updatedExchanges);
      toast.success("Exchange synced successfully");
    } catch (error) {
      console.error("Error syncing exchange:", error);
      toast.error("Error syncing exchange");
    } finally {
      setSyncing(null);
    }
  };

  const handleToggleActive = async (
    exchangeId: string,
    currentStatus: boolean
  ) => {
    try {
      const response = await fetch(`/api/exchanges/${exchangeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (response.ok) {
        const updatedExchange = await response.json();
        const updatedExchanges = exchanges.map((ex) =>
          ex.id === exchangeId ? updatedExchange : ex
        );
        onExchangesChange(updatedExchanges);
        toast.success(`Exchange ${!currentStatus ? "enabled" : "disabled"}`);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to update exchange status");
      }
    } catch (error) {
      console.error("Error updating exchange:", error);
      toast.error("Error updating exchange");
    }
  };

  const handleDelete = async (exchangeId: string) => {
    if (!confirm("Are you sure you want to delete this exchange?")) return;

    try {
      const response = await fetch(`/api/exchanges/${exchangeId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        const updatedExchanges = exchanges.filter((ex) => ex.id !== exchangeId);
        onExchangesChange(updatedExchanges);
        toast.success("Exchange deleted successfully");
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to delete exchange");
      }
    } catch (error) {
      console.error("Error deleting exchange:", error);
      toast.error("Error deleting exchange");
    }
  };

  const handleEdit = (exchange: Exchange) => {
    setEditingExchange(exchange);
    setShowEditDialog(true);
  };

  const handleExchangeUpdated = (updatedExchange: Exchange) => {
    const updatedExchanges = exchanges.map((ex) =>
      ex.id === updatedExchange.id ? updatedExchange : ex
    );
    onExchangesChange(updatedExchanges);
    setShowEditDialog(false);
    setEditingExchange(null);
  };

  const fetchExchanges = async () => {
    try {
      const response = await axios.get("/api/exchanges");
      const data = response.data;
      onExchangesChange(data);
      setSyncing(null);
    } catch (error) {
      console.error("Error fetching exchanges:", error);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Connected Exchanges ({exchanges.length})</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSyncing("all");
                fetchExchanges();
              }}
              disabled={syncing === "all"}
            >
              <RefreshCw
                className={`w-4 h-4 ${syncing === "all" ? "animate-spin" : ""}`}
              />{" "}
              Refresh All
            </Button>
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
                  syncing={syncing}
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
          userId={selectedUser.id}
        />
      </Dialog>
    </>
  );
}
