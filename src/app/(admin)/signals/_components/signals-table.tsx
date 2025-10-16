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
import {
  MoreHorizontal,
  Search,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { SignalWithBot } from "@/db/actions/admin/get-all-signals";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EditSignalDialog } from "./edit-signal-dialog";
import { DeleteSignalDialog } from "./delete-signal-dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface SignalsTableProps {
  signals: SignalWithBot[];
}

export function SignalsTable({ signals }: SignalsTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [actionFilter, setActionFilter] = useState<string>("ALL");
  const [selectedSignalForEdit, setSelectedSignalForEdit] = useState<SignalWithBot | null>(null);
  const [selectedSignalForDelete, setSelectedSignalForDelete] = useState<SignalWithBot | null>(null);
  const router = useRouter();

  // Filter signals based on search and filters
  const filteredSignals = signals.filter((signal) => {
    const matchesSearch =
      signal.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      signal.customerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      signal.botName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      signal.symbol.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "PROCESSED" && signal.processed) ||
      (statusFilter === "PENDING" && !signal.processed) ||
      (statusFilter === "ERROR" && signal.error);

    const matchesAction = actionFilter === "ALL" || signal.action === actionFilter;

    return matchesSearch && matchesStatus && matchesAction;
  });

  const handleVisibilityToggle = async (signalId: string, currentVisibility: boolean) => {
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
      router.refresh();
    } catch (error) {
      console.error("Error updating visibility:", error);
      toast.error("Failed to update visibility");
    }
  };

  const getActionBadge = (action: string) => {
    const configs = {
      ENTER_LONG: { label: "Enter Long", variant: "default" as const, icon: TrendingUp, color: "bg-green-500" },
      EXIT_LONG: { label: "Exit Long", variant: "secondary" as const, icon: TrendingDown, color: "bg-blue-500" },
      ENTER_SHORT: { label: "Enter Short", variant: "destructive" as const, icon: TrendingDown, color: "bg-red-500" },
      EXIT_SHORT: { label: "Exit Short", variant: "outline" as const, icon: TrendingUp, color: "bg-orange-500" },
    };

    const config = configs[action as keyof typeof configs];
    if (!config) return <Badge variant="outline">{action}</Badge>;

    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="size-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 md:max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by customer, bot, or symbol..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="PROCESSED">Processed</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="ERROR">Error</SelectItem>
            </SelectContent>
          </Select>

          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Actions</SelectItem>
              <SelectItem value="ENTER_LONG">Enter Long</SelectItem>
              <SelectItem value="EXIT_LONG">Exit Long</SelectItem>
              <SelectItem value="ENTER_SHORT">Enter Short</SelectItem>
              <SelectItem value="EXIT_SHORT">Exit Short</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2 rounded-lg border px-4 py-2">
          <span className="text-sm text-muted-foreground">Total Signals:</span>
          <span className="font-semibold">{filteredSignals.length}</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg border px-4 py-2">
          <span className="text-sm text-muted-foreground">Processed:</span>
          <span className="font-semibold">
            {signals.filter((s) => s.processed).length}
          </span>
        </div>
        <div className="flex items-center gap-2 rounded-lg border px-4 py-2">
          <span className="text-sm text-muted-foreground">Pending:</span>
          <span className="font-semibold">
            {signals.filter((s) => !s.processed).length}
          </span>
        </div>
        <div className="flex items-center gap-2 rounded-lg border px-4 py-2">
          <span className="text-sm text-muted-foreground">Errors:</span>
          <span className="font-semibold">
            {signals.filter((s) => s.error).length}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Bot</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Symbol</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Visible to Customer</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSignals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center">
                  <div className="py-8 text-muted-foreground">
                    {searchQuery || statusFilter !== "ALL" || actionFilter !== "ALL"
                      ? "No signals found matching your filters"
                      : "No signals found"}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredSignals.map((signal) => (
                <TableRow key={signal.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{signal.customerName}</div>
                      <div className="text-xs text-muted-foreground">
                        {signal.customerEmail}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{signal.botName}</span>
                  </TableCell>
                  <TableCell>{getActionBadge(signal.action)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{signal.symbol}</Badge>
                  </TableCell>
                  <TableCell>
                    {signal.price ? `$${signal.price.toFixed(2)}` : "-"}
                  </TableCell>
                  <TableCell>
                    {signal.error ? (
                      <Badge variant="destructive">Error</Badge>
                    ) : signal.processed ? (
                      <Badge variant="default">Processed</Badge>
                    ) : (
                      <Badge variant="secondary">Pending</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={signal.visibleToCustomer}
                        onCheckedChange={() =>
                          handleVisibilityToggle(signal.id, signal.visibleToCustomer)
                        }
                      />
                      {signal.visibleToCustomer ? (
                        <Eye className="size-4 text-green-600" />
                      ) : (
                        <EyeOff className="size-4 text-muted-foreground" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {new Date(signal.createdAt).toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="size-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setSelectedSignalForEdit(signal)}
                        >
                          <Edit className="mr-2 size-4" />
                          Edit Signal
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setSelectedSignalForDelete(signal)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 size-4" />
                          Delete Signal
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialogs */}
      {selectedSignalForEdit && (
        <EditSignalDialog
          open={!!selectedSignalForEdit}
          onOpenChange={(open) => !open && setSelectedSignalForEdit(null)}
          signal={selectedSignalForEdit}
        />
      )}

      {selectedSignalForDelete && (
        <DeleteSignalDialog
          open={!!selectedSignalForDelete}
          onOpenChange={(open) => !open && setSelectedSignalForDelete(null)}
          signal={selectedSignalForDelete}
        />
      )}
    </div>
  );
}

