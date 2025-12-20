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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { UserWithAgent } from "@/db/actions/admin/get-all-users";
import { useBotsQuery } from "@/features/signal-bot";
import {
    SignalWithBot,
    useSignalsQuery,
    useUpdateSignalMutation,
    useDeleteSignalMutation,
    useBulkUpdateVisibilityMutation,
    useBulkUpdateProcessedStatusMutation
} from "../index";

// Import local feature dialogs
import {
    EditSignalDialog,
    DeleteSignalDialog,
    CreateSignalDialog,
    UploadSignalsCsvDialog
} from "./dialogs";

interface UserSignalsManagerProps {
    selectedUser: UserWithAgent;
}

export function UserSignalsManager({ selectedUser }: UserSignalsManagerProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("ALL");
    const [actionFilter, setActionFilter] = useState<string>("ALL");
    const [botFilter, setBotFilter] = useState<string>("ALL");
    const [selectedSignalForEdit, setSelectedSignalForEdit] = useState<any | null>(null);
    const [selectedSignalForDelete, setSelectedSignalForDelete] = useState<any | null>(null);
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [showUploadCsvDialog, setShowUploadCsvDialog] = useState(false);
    const [selectedSignals, setSelectedSignals] = useState<Set<string>>(new Set());
    const [updatingSignalId, setUpdatingSignalId] = useState<string | null>(null);

    const queryClient = useQueryClient();

    // Fetch signals for the selected user using our new feature hook
    const { data, isLoading } = useSignalsQuery({
        userId: selectedUser.id,
    }, {
        enabled: !!selectedUser.id,
    });
    const signals = data?.signals || [];

    const updateMutation = useUpdateSignalMutation();
    const deleteMutation = useDeleteSignalMutation();
    const bulkVisibilityMutation = useBulkUpdateVisibilityMutation();
    const bulkStatusMutation = useBulkUpdateProcessedStatusMutation();

    // Fetch bots for the selected user
    const { data: botsData } = useBotsQuery({
        userId: selectedUser.id,
    }, {
        enabled: !!selectedUser.id && (selectedUser as any).hasPortfolio,
    });
    const bots = botsData?.bots || [];

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
            await updateMutation.mutateAsync({
                id: signalId,
                visibleToCustomer: !currentVisibility,
            });
        } finally {
            setUpdatingSignalId(null);
        }
    };

    const handleBulkVisibilityUpdate = async (visible: boolean) => {
        if (selectedSignals.size === 0) return;
        try {
            await bulkVisibilityMutation.mutateAsync({
                ids: Array.from(selectedSignals),
                visible,
            });
            setSelectedSignals(new Set());
        } catch (error) { }
    };

    const handleBulkProcessedUpdate = async (processed: boolean) => {
        if (selectedSignals.size === 0) return;
        try {
            await bulkStatusMutation.mutateAsync({
                ids: Array.from(selectedSignals),
                processed,
            });
            setSelectedSignals(new Set());
        } catch (error) { }
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

        const config = configs[action as keyof typeof configs] || { label: action, variant: "outline" as const, icon: TrendingUp, color: "" };
        const Icon = config.icon;

        return (
            <Badge variant={config.variant} className={config.color}>
                <Icon className="mr-1 size-3" />
                {config.label}
            </Badge>
        );
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-slate-500">
                <Loader2 className="size-10 animate-spin text-teal-600 mb-4" />
                <p className="font-medium">Loading user signals...</p>
            </div>
        );
    }

    // Only customers can have signals (through their bots)
    if (selectedUser.role !== "CUSTOMER") {
        return (
            <div className="p-12 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
                <div className="size-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <EyeOff className="size-8 text-slate-400" />
                </div>
                <h4 className="text-xl font-bold text-slate-900 mb-2">Not Applicable</h4>
                <p className="text-slate-600 max-w-md mx-auto">
                    Signal management is only available for customer accounts with active trading bots.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <div>
                    <h3 className="text-2xl font-bold text-slate-900">Manage Trading Signals</h3>
                    <p className="text-sm text-slate-600 mt-1">
                        Displaying activity for <span className="font-semibold text-teal-700">{selectedUser.name}</span>
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={handleExportCSV}
                        className="border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl px-4 py-2 font-medium shadow-sm transition-all"
                        disabled={filteredSignals.length === 0}
                    >
                        <Download className="mr-2 size-4" />
                        Export CSV
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => setShowUploadCsvDialog(true)}
                        className="border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100 rounded-xl px-4 py-2 font-medium shadow-sm transition-all"
                    >
                        <Upload className="mr-2 size-4" />
                        Upload CSV
                    </Button>
                    <Button
                        onClick={() => setShowCreateDialog(true)}
                        className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white rounded-xl px-5 py-2 font-semibold shadow-md transition-all"
                    >
                        <Plus className="mr-2 size-4" />
                        Add Signal
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    <Input
                        placeholder="Search by bot, symbol, or message..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 border-slate-200 focus:ring-teal-500 rounded-lg"
                    />
                </div>

                <div className="flex flex-wrap gap-2">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[160px] border-slate-200 font-medium">
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
                        <SelectTrigger className="w-[160px] border-slate-200 font-medium">
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

                    <Select value={botFilter} onValueChange={setBotFilter}>
                        <SelectTrigger className="w-[160px] border-slate-200 font-medium">
                            <SelectValue placeholder="Bot" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Bots</SelectItem>
                            {bots.map((bot: any) => (
                                <SelectItem key={bot.id} value={bot.id}>{bot.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Bulk Actions */}
            {selectedSignals.size > 0 && (
                <div className="flex items-center justify-between gap-4 rounded-xl border-2 border-teal-200 bg-teal-50/50 px-6 py-4 shadow-sm animate-in slide-in-from-top duration-300">
                    <div className="flex items-center gap-4">
                        <span className="text-base font-bold text-teal-900">
                            {selectedSignals.size} signals selected
                        </span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedSignals(new Set())}
                            className="text-teal-700 hover:bg-teal-100 font-medium"
                        >
                            Clear Selection
                        </Button>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-slate-600">Visibility:</span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleBulkVisibilityUpdate(true)}
                                className="bg-white border-teal-200 text-teal-700 hover:bg-teal-600 hover:text-white"
                                disabled={bulkVisibilityMutation.isPending}
                            >
                                Show selected
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleBulkVisibilityUpdate(false)}
                                className="bg-white border-slate-200 text-slate-700 hover:bg-slate-600 hover:text-white"
                                disabled={bulkVisibilityMutation.isPending}
                            >
                                Hide selected
                            </Button>
                        </div>
                        <div className="h-6 w-px bg-slate-300 mx-2" />
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-slate-600">Status:</span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleBulkProcessedUpdate(true)}
                                className="bg-white border-teal-200 text-teal-700 hover:bg-teal-600 hover:text-white"
                                disabled={bulkStatusMutation.isPending}
                            >
                                Mark Processed
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleBulkProcessedUpdate(false)}
                                className="bg-white border-orange-200 text-orange-700 hover:bg-orange-600 hover:text-white"
                                disabled={bulkStatusMutation.isPending}
                            >
                                Mark Pending
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="rounded-xl border border-slate-200 overflow-hidden shadow-md bg-white">
                <Table>
                    <TableHeader className="bg-slate-50">
                        <TableRow className="border-b border-slate-200">
                            <TableHead className="w-12 py-4">
                                <Checkbox
                                    checked={filteredSignals.length > 0 && selectedSignals.size === filteredSignals.length}
                                    onCheckedChange={handleSelectAll}
                                    className="border-teal-600 data-[state=checked]:bg-teal-600"
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
                                <TableCell colSpan={9} className="text-center py-20 text-slate-400 text-lg italic">
                                    No signals found for this search/filter criteria.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredSignals.map((signal) => {
                                const isUpdating = updatingSignalId === signal.id;
                                return (
                                    <TableRow
                                        key={signal.id}
                                        className={`border-b border-slate-100 transition-colors ${selectedSignals.has(signal.id) ? "bg-teal-50/30" : "hover:bg-slate-50"} ${isUpdating ? "opacity-60" : ""}`}
                                    >
                                        <TableCell className="py-4">
                                            <Checkbox
                                                checked={selectedSignals.has(signal.id)}
                                                onCheckedChange={(checked) => handleSelectSignal(signal.id, checked as boolean)}
                                                className="border-teal-600 data-[state=checked]:bg-teal-600"
                                                disabled={isUpdating}
                                            />
                                        </TableCell>
                                        <TableCell className="font-semibold text-slate-900 py-4">{signal.botName}</TableCell>
                                        <TableCell className="py-4">{getActionBadge(signal.action)}</TableCell>
                                        <TableCell className="font-bold text-slate-800 py-4">{signal.symbol}</TableCell>
                                        <TableCell className="text-slate-700 font-medium py-4">
                                            {signal.price ? `$${signal.price.toLocaleString()}` : "-"}
                                        </TableCell>
                                        <TableCell className="py-4">
                                            {signal.error ? (
                                                <Badge variant="destructive" className="bg-red-500 shadow-sm">Error</Badge>
                                            ) : signal.processed ? (
                                                <Badge variant="default" className="bg-teal-500 shadow-sm">Processed</Badge>
                                            ) : (
                                                <Badge variant="outline" className="border-orange-300 bg-orange-50 text-orange-700 shadow-sm">Pending</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <div className="flex items-center gap-2">
                                                {isUpdating && <Loader2 className="size-4 animate-spin text-teal-600" />}
                                                <Switch
                                                    checked={signal.visibleToCustomer}
                                                    onCheckedChange={() => handleVisibilityToggle(signal.id, signal.visibleToCustomer)}
                                                    className="data-[state=checked]:bg-teal-600"
                                                    disabled={isUpdating}
                                                />
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-slate-600 text-sm font-medium py-4">
                                            {new Date(signal.createdAt).toLocaleString()}
                                        </TableCell>
                                        <TableCell className="text-right py-4">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="hover:bg-slate-100 rounded-lg">
                                                        <MoreHorizontal className="size-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="rounded-lg">
                                                    <DropdownMenuItem
                                                        onClick={() => setSelectedSignalForEdit(signal)}
                                                        className="cursor-pointer"
                                                    >
                                                        <Edit className="mr-2 size-4" />
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        onClick={() => setSelectedSignalForDelete(signal)}
                                                        className="text-red-600 focus:bg-red-50 cursor-pointer"
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
                    queryClient.invalidateQueries({ queryKey: ["admin-signals"] });
                }}
            />

            <UploadSignalsCsvDialog
                open={showUploadCsvDialog}
                onOpenChange={setShowUploadCsvDialog}
                userId={selectedUser.id}
                bots={bots}
                onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ["admin-signals"] });
                }}
            />

            {selectedSignalForEdit && (
                <EditSignalDialog
                    open={!!selectedSignalForEdit}
                    onOpenChange={(open: boolean) => !open && setSelectedSignalForEdit(null)}
                    signal={selectedSignalForEdit}
                />
            )}

            {selectedSignalForDelete && (
                <DeleteSignalDialog
                    open={!!selectedSignalForDelete}
                    onOpenChange={(open: boolean) => !open && setSelectedSignalForDelete(null)}
                    signal={selectedSignalForDelete}
                />
            )}
        </div>
    );
}
