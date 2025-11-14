"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  MoreHorizontal,
  Search,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  TrendingUp,
  TrendingDown,
  Plus,
  Upload,
  Download,
  CheckCircle2,
  Clock,
  Loader2,
} from "lucide-react";
import { UserSignal } from "@/db/actions/admin/get-user-signals";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { UserWithAgent } from "@/db/actions/admin/get-all-users";
import { SignalBot } from "@/types/signal-bot";
import { CreateSignalDialog } from "../../signal-bot/_components/dialogs/create-signal-dialog";
import { EditUserSignalDialog } from "../../signal-bot/_components/dialogs/edit-user-signal-dialog";
import { DeleteUserSignalDialog } from "../../signal-bot/_components/dialogs/delete-user-signal-dialog";
import { UploadSignalsCsvDialog } from "../../signal-bot/_components/dialogs/upload-signals-csv-dialog";

interface UserSignalsManagerProps {
  selectedUser: UserWithAgent;
}

export function UserSignalsManager({ selectedUser }: UserSignalsManagerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [actionFilter, setActionFilter] = useState<string>("ALL");
  const [botFilter, setBotFilter] = useState<string>("ALL");
  const [selectedSignalForEdit, setSelectedSignalForEdit] = useState<UserSignal | null>(null);
  const [selectedSignalForDelete, setSelectedSignalForDelete] = useState<UserSignal | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showUploadCsvDialog, setShowUploadCsvDialog] = useState(false);
  const [selectedSignals, setSelectedSignals] = useState<Set<string>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState<string | null>(null);
  const [updatingSignalId, setUpdatingSignalId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Fetch signals for the selected user
  const { data: signals = [], isLoading } = useQuery<UserSignal[]>({
    queryKey: ["user-signals", selectedUser.id],
    queryFn: async () => {
      const response = await axios.get(`/api/admin/users/${selectedUser.id}/signals`);
      return response.data;
    },
    enabled: !!selectedUser.id,
  });

  // Fetch bots for the selected user
  const { data: bots = [] } = useQuery<SignalBot[]>({
    queryKey: ["signal-bots", selectedUser.id],
    queryFn: async () => {
      const response = await axios.get("/api/signal-bots");
      return response.data;
    },
    enabled: !!selectedUser.id && selectedUser.hasPortfolio,
  });

  // Filter signals
  const filteredSignals = signals.filter((signal) => {
    const matchesSearch =
      signal.botName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      signal.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (signal.message?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);

    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "PROCESSED" && signal.processed) ||
      (statusFilter === "PENDING" && !signal.processed && !signal.error) ||
      (statusFilter === "ERROR" && signal.error);

    const matchesAction = actionFilter === "ALL" || signal.action === actionFilter;
    const matchesBot = botFilter === "ALL" || signal.botId === botFilter;

    return matchesSearch && matchesStatus && matchesAction && matchesBot;
  });

  const handleVisibilityToggle = async (signalId: string, currentVisibility: boolean) => {
    setUpdatingSignalId(signalId);
    try {
      const response = await fetch(`/api/admin/signals/${signalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visibleToCustomer: !currentVisibility }),
      });

      if (!response.ok) {
        throw new Error("Failed to update visibility");
      }

      toast.success(`Signal ${!currentVisibility ? "visible" : "hidden"} to customer`);
      queryClient.invalidateQueries({ queryKey: ["user-signals", selectedUser.id] });
    } catch (error) {
      console.error("Error updating visibility:", error);
      toast.error("Failed to update visibility");
    } finally {
      setUpdatingSignalId(null);
    }
  };

  const handleBulkVisibilityUpdate = async (visible: boolean) => {
    if (selectedSignals.size === 0) {
      toast.error("Please select signals to update");
      return;
    }

    const actionKey = visible ? 'visibility-show' : 'visibility-hide';
    setBulkActionLoading(actionKey);
    try {
      const promises = Array.from(selectedSignals).map((signalId) =>
        fetch(`/api/admin/signals/${signalId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ visibleToCustomer: visible }),
        })
      );

      await Promise.all(promises);
      
      toast.success(`Updated ${selectedSignals.size} signal${selectedSignals.size > 1 ? 's' : ''} visibility`);
      setSelectedSignals(new Set());
      queryClient.invalidateQueries({ queryKey: ["user-signals", selectedUser.id] });
    } catch (error) {
      console.error("Error updating bulk visibility:", error);
      toast.error("Failed to update visibility");
    } finally {
      setBulkActionLoading(null);
    }
  };

  const handleBulkProcessedUpdate = async (processed: boolean) => {
    if (selectedSignals.size === 0) {
      toast.error("Please select signals to update");
      return;
    }

    const actionKey = processed ? 'processed-true' : 'processed-false';
    setBulkActionLoading(actionKey);
    try {
      const promises = Array.from(selectedSignals).map((signalId) =>
        fetch(`/api/admin/signals/${signalId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ processed }),
        })
      );

      await Promise.all(promises);
      
      toast.success(
        `Marked ${selectedSignals.size} signal${selectedSignals.size > 1 ? 's' : ''} as ${processed ? 'processed' : 'pending'}`
      );
      setSelectedSignals(new Set());
      queryClient.invalidateQueries({ queryKey: ["user-signals", selectedUser.id] });
    } catch (error) {
      console.error("Error updating bulk processed status:", error);
      toast.error("Failed to update processed status");
    } finally {
      setBulkActionLoading(null);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allSignalIds = new Set(filteredSignals.map((s) => s.id));
      setSelectedSignals(allSignalIds);
    } else {
      setSelectedSignals(new Set());
    }
  };

  const handleSelectSignal = (signalId: string, checked: boolean) => {
    const newSelected = new Set(selectedSignals);
    if (checked) {
      newSelected.add(signalId);
    } else {
      newSelected.delete(signalId);
    }
    setSelectedSignals(newSelected);
  };

  const handleExportCSV = () => {
    const csvData = [
      ["Bot", "Action", "Symbol", "Price", "Status", "Visible", "Message", "Created"],
      ...filteredSignals.map((signal) => [
        signal.botName,
        signal.action,
        signal.symbol,
        signal.price?.toString() || "",
        signal.error ? "Error" : signal.processed ? "Processed" : "Pending",
        signal.visibleToCustomer ? "Yes" : "No",
        signal.message || "",
        new Date(signal.createdAt).toLocaleString(),
      ]),
    ];

    const csvContent = csvData.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `signals_${selectedUser.name}_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV exported successfully");
  };

  const getActionBadge = (action: string) => {
    const configs = {
      ENTER_LONG: { label: "Enter Long", variant: "default" as const, icon: TrendingUp, color: "bg-teal-500 hover:bg-teal-600 text-white" },
      EXIT_LONG: { label: "Exit Long", variant: "secondary" as const, icon: TrendingDown, color: "bg-blue-500 hover:bg-blue-600 text-white" },
      ENTER_SHORT: { label: "Enter Short", variant: "destructive" as const, icon: TrendingDown, color: "bg-red-500 hover:bg-red-600 text-white" },
      EXIT_SHORT: { label: "Exit Short", variant: "default" as const, icon: TrendingUp, color: "bg-orange-500 hover:bg-orange-600 text-white" },
    };

    const config = configs[action as keyof typeof configs] || configs.ENTER_LONG;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className={config.color}>
        <Icon className="mr-1 size-3" />
        {config.label}
      </Badge>
    );
  };

  if (isLoading) {
    return <div className="p-4 text-center text-muted-foreground">Loading signals...</div>;
  }

  // Only customers can have signals (through their bots)
  if (selectedUser.role !== "CUSTOMER") {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">
          Signal management is only available for customers.
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Please select a customer user to manage their signals.
        </p>
      </div>
    );
  }

  // Check if customer has a portfolio
  if (!selectedUser.hasPortfolio) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">
          This customer does not have a portfolio yet.
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          A portfolio is required to create signal bots and manage signals.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h3 className="text-2xl font-bold text-slate-900">Signal Management</h3>
          <p className="text-sm text-slate-600 mt-1">
            Manage signals for <span className="font-semibold text-teal-700">{selectedUser.name}</span>
          </p>
        </div>
        {selectedUser.role === "CUSTOMER" && (
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={handleExportCSV}
              className="border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 cursor-pointer rounded-xl px-4 py-2 font-medium shadow-sm transition-all duration-200"
              disabled={filteredSignals.length === 0 || bulkActionLoading !== null}
            >
              <Download className="mr-2 size-4" />
              Export CSV
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowUploadCsvDialog(true)}
              className="border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100 hover:border-teal-300 cursor-pointer rounded-xl px-4 py-2 font-medium shadow-sm transition-all duration-200"
              disabled={bulkActionLoading !== null}
            >
              <Upload className="mr-2 size-4" />
              Upload CSV
            </Button>
            <Button 
              onClick={() => setShowCreateDialog(true)}
              className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white cursor-pointer rounded-xl px-5 py-2 font-semibold shadow-md hover:shadow-lg transition-all duration-200"
              disabled={bulkActionLoading !== null}
            >
              <Plus className="mr-2 size-4" />
              Add Signal
            </Button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center bg-slate-50 p-4 rounded-xl border border-slate-200">
        <div className="relative flex-1 md:max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
          <Input
            placeholder="Search by bot, symbol, or message..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 border-slate-200 bg-white focus:border-teal-500 focus:ring-teal-500 rounded-lg shadow-sm"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-[180px] border-slate-200 bg-white focus:border-teal-500 focus:ring-teal-500 rounded-lg shadow-sm font-medium">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="rounded-lg">
            <SelectItem value="ALL">All Status</SelectItem>
            <SelectItem value="PROCESSED">Processed</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="ERROR">Error</SelectItem>
          </SelectContent>
        </Select>

        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-full md:w-[180px] border-slate-200 bg-white focus:border-teal-500 focus:ring-teal-500 rounded-lg shadow-sm font-medium">
            <SelectValue placeholder="Action" />
          </SelectTrigger>
          <SelectContent className="rounded-lg">
            <SelectItem value="ALL">All Actions</SelectItem>
            <SelectItem value="ENTER_LONG">Enter Long</SelectItem>
            <SelectItem value="EXIT_LONG">Exit Long</SelectItem>
            <SelectItem value="ENTER_SHORT">Enter Short</SelectItem>
            <SelectItem value="EXIT_SHORT">Exit Short</SelectItem>
          </SelectContent>
        </Select>

        <Select value={botFilter} onValueChange={setBotFilter}>
          <SelectTrigger className="w-full md:w-[180px] border-slate-200 bg-white focus:border-teal-500 focus:ring-teal-500 rounded-lg shadow-sm font-medium">
            <SelectValue placeholder="Bot" />
          </SelectTrigger>
          <SelectContent className="rounded-lg">
            <SelectItem value="ALL">All Bots</SelectItem>
            {bots.map((bot) => (
              <SelectItem key={bot.id} value={bot.id}>
                {bot.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-3 shadow-sm">
          <span className="text-sm font-medium text-slate-600">Total Signals:</span>
          <span className="text-lg font-bold text-slate-900">{signals.length}</span>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-teal-200 bg-gradient-to-br from-teal-50 to-cyan-50 px-5 py-3 shadow-sm">
          <span className="text-sm font-medium text-teal-700">Processed:</span>
          <span className="font-bold text-teal-900">
            {signals.filter((s) => s.processed).length}
          </span>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 px-5 py-3 shadow-sm">
          <span className="text-sm font-medium text-blue-700">Pending:</span>
          <span className="text-lg font-bold text-blue-900">
            {signals.filter((s) => !s.processed && !s.error).length}
          </span>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-gradient-to-br from-red-50 to-rose-50 px-5 py-3 shadow-sm">
          <span className="text-sm font-medium text-red-700">Errors:</span>
          <span className="text-lg font-bold text-red-900">
            {signals.filter((s) => s.error).length}
          </span>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedSignals.size > 0 && (
        <div className="flex flex-col gap-4 rounded-xl border-2 border-teal-300 bg-gradient-to-r from-teal-50 via-cyan-50 to-teal-50 px-6 py-4 shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-base font-bold text-teal-900">
                {bulkActionLoading !== null ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="size-5 animate-spin text-teal-600" />
                    Updating {selectedSignals.size} signal{selectedSignals.size > 1 ? 's' : ''}...
                  </span>
                ) : (
                  `${selectedSignals.size} signal${selectedSignals.size > 1 ? 's' : ''} selected`
                )}
              </span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setSelectedSignals(new Set())}
                className="border-teal-300 bg-white text-teal-700 hover:bg-teal-100 hover:border-teal-400 cursor-pointer rounded-lg font-medium shadow-sm transition-all duration-200"
                disabled={bulkActionLoading !== null}
              >
                Clear Selection
              </Button>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-slate-700">Visibility:</span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleBulkVisibilityUpdate(true)}
                className="border-teal-300 bg-white text-teal-700 hover:bg-teal-600 hover:text-white hover:border-teal-600 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 rounded-lg font-medium shadow-sm transition-all duration-200"
                disabled={bulkActionLoading !== null}
              >
                {bulkActionLoading === 'visibility-show' ? (
                  <Loader2 className="mr-1.5 size-4 animate-spin" />
                ) : (
                  <Eye className="mr-1.5 size-4" />
                )}
                Make Visible
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleBulkVisibilityUpdate(false)}
                className="border-slate-300 bg-white text-slate-700 hover:bg-slate-600 hover:text-white hover:border-slate-600 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 rounded-lg font-medium shadow-sm transition-all duration-200"
                disabled={bulkActionLoading !== null}
              >
                {bulkActionLoading === 'visibility-hide' ? (
                  <Loader2 className="mr-1.5 size-4 animate-spin" />
                ) : (
                  <EyeOff className="mr-1.5 size-4" />
                )}
                Make Hidden
              </Button>
            </div>

            <div className="h-8 w-px bg-slate-300" />

            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-slate-700">Status:</span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleBulkProcessedUpdate(true)}
                className="border-teal-300 bg-white text-teal-700 hover:bg-teal-600 hover:text-white hover:border-teal-600 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 rounded-lg font-medium shadow-sm transition-all duration-200"
                disabled={bulkActionLoading !== null}
              >
                {bulkActionLoading === 'processed-true' ? (
                  <Loader2 className="mr-1.5 size-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-1.5 size-4" />
                )}
                Mark Processed
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleBulkProcessedUpdate(false)}
                className="border-orange-300 bg-white text-orange-700 hover:bg-orange-600 hover:text-white hover:border-orange-600 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 rounded-lg font-medium shadow-sm transition-all duration-200"
                disabled={bulkActionLoading !== null}
              >
                {bulkActionLoading === 'processed-false' ? (
                  <Loader2 className="mr-1.5 size-4 animate-spin" />
                ) : (
                  <Clock className="mr-1.5 size-4" />
                )}
                Mark Pending
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-slate-200 overflow-hidden shadow-md bg-white">
        <Table>
          <TableHeader className="bg-gradient-to-r from-slate-50 to-slate-100">
            <TableRow className="border-b-2 border-slate-200 hover:bg-slate-100">
              <TableHead className="w-12 py-4">
                <Checkbox
                  checked={filteredSignals.length > 0 && selectedSignals.size === filteredSignals.length}
                  onCheckedChange={handleSelectAll}
                  className="border-teal-600 data-[state=checked]:bg-teal-600 cursor-pointer"
                  disabled={bulkActionLoading !== null}
                />
              </TableHead>
              <TableHead className="font-bold text-slate-900 py-4">Bot</TableHead>
              <TableHead className="font-bold text-slate-900 py-4">Action</TableHead>
              <TableHead className="font-bold text-slate-900 py-4">Symbol</TableHead>
              <TableHead className="font-bold text-slate-900 py-4">Price</TableHead>
              <TableHead className="font-bold text-slate-900 py-4">Status</TableHead>
              <TableHead className="font-bold text-slate-900 py-4">Visible</TableHead>
              <TableHead className="font-bold text-slate-900 py-4">Created</TableHead>
              <TableHead className="text-right font-bold text-slate-900 py-4">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSignals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-12 text-slate-500 text-base">
                  {signals.length === 0
                    ? "No signals found for this user"
                    : "No signals match your filters"}
                </TableCell>
              </TableRow>
            ) : (
              filteredSignals.map((signal) => {
                const isUpdating = updatingSignalId === signal.id;
                return (
                  <TableRow 
                    key={signal.id}
                    className={`border-b border-slate-100 transition-all duration-200 ${selectedSignals.has(signal.id) ? "bg-gradient-to-r from-teal-50 to-cyan-50" : "hover:bg-slate-50"} ${isUpdating ? "opacity-60" : ""}`}
                  >
                    <TableCell className="py-4">
                      <Checkbox
                        checked={selectedSignals.has(signal.id)}
                        onCheckedChange={(checked) => handleSelectSignal(signal.id, checked as boolean)}
                        className="border-teal-600 data-[state=checked]:bg-teal-600 cursor-pointer"
                        disabled={bulkActionLoading !== null || isUpdating}
                      />
                    </TableCell>
                    <TableCell className="font-semibold text-slate-900 py-4">{signal.botName}</TableCell>
                    <TableCell className="py-4">{getActionBadge(signal.action)}</TableCell>
                    <TableCell className="font-semibold text-slate-800 py-4">{signal.symbol}</TableCell>
                    <TableCell className="text-slate-700 font-medium py-4">
                      {signal.price ? `$${signal.price.toLocaleString()}` : "-"}
                    </TableCell>
                    <TableCell className="py-4">
                      {signal.error ? (
                        <Badge variant="destructive" className="bg-red-500 hover:bg-red-600 shadow-sm">Error</Badge>
                      ) : signal.processed ? (
                        <Badge variant="default" className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 shadow-sm">
                          Processed
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-orange-300 bg-orange-50 text-orange-700 shadow-sm">Pending</Badge>
                      )}
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center gap-2">
                        {isUpdating && (
                          <Loader2 className="size-4 animate-spin text-teal-600" />
                        )}
                        <Switch
                          checked={signal.visibleToCustomer}
                          onCheckedChange={() =>
                            handleVisibilityToggle(signal.id, signal.visibleToCustomer)
                          }
                          className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-teal-600 data-[state=checked]:to-cyan-600 cursor-pointer"
                          disabled={bulkActionLoading !== null || isUpdating}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-slate-600 font-medium py-4">
                      {new Date(signal.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right py-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="hover:bg-teal-50 hover:text-teal-700 rounded-lg transition-colors cursor-pointer"
                            disabled={bulkActionLoading !== null || isUpdating}
                          >
                            <MoreHorizontal className="size-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-lg shadow-lg">
                          <DropdownMenuLabel className="text-slate-900 font-bold">Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator className="bg-slate-200" />
                          <DropdownMenuItem
                            onClick={() => setSelectedSignalForEdit(signal)}
                            className="focus:bg-teal-50 focus:text-teal-900 cursor-pointer rounded-md font-medium"
                          >
                            <Edit className="mr-2 size-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setSelectedSignalForDelete(signal)}
                            className="text-red-600 focus:bg-red-50 focus:text-red-700 cursor-pointer rounded-md font-medium"
                          >
                            <Trash2 className="mr-2 size-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialogs */}
      <CreateSignalDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        userId={selectedUser.id}
        bots={bots}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["user-signals", selectedUser.id] });
        }}
      />

      <UploadSignalsCsvDialog
        open={showUploadCsvDialog}
        onOpenChange={setShowUploadCsvDialog}
        userId={selectedUser.id}
        bots={bots}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["user-signals", selectedUser.id] });
        }}
      />

      {selectedSignalForEdit && (
        <EditUserSignalDialog
          open={!!selectedSignalForEdit}
          onOpenChange={(open) => !open && setSelectedSignalForEdit(null)}
          signal={selectedSignalForEdit}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["user-signals", selectedUser.id] });
          }}
        />
      )}

      {selectedSignalForDelete && (
        <DeleteUserSignalDialog
          open={!!selectedSignalForDelete}
          onOpenChange={(open) => !open && setSelectedSignalForDelete(null)}
          signal={selectedSignalForDelete}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["user-signals", selectedUser.id] });
          }}
        />
      )}
    </div>
  );
}

