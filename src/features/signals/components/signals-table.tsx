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
    Loader2,
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import {
    SignalWithBot,
    useUpdateSignalMutation,
    useDeleteSignalMutation
} from "../index";
import { EditSignalDialog, DeleteSignalDialog } from "./dialogs";

interface SignalsTableProps {
    signals: SignalWithBot[];
}

export function SignalsTable({ signals }: SignalsTableProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("ALL");
    const [actionFilter, setActionFilter] = useState<string>("ALL");
    const [selectedSignalForEdit, setSelectedSignalForEdit] = useState<SignalWithBot | null>(null);
    const [selectedSignalForDelete, setSelectedSignalForDelete] = useState<SignalWithBot | null>(null);
    const [updatingSignalId, setUpdatingSignalId] = useState<string | null>(null);

    const updateMutation = useUpdateSignalMutation();
    const deleteMutation = useDeleteSignalMutation();

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
            (statusFilter === "PENDING" && !signal.processed && !signal.error) ||
            (statusFilter === "ERROR" && signal.error);

        const matchesAction = actionFilter === "ALL" || signal.action === actionFilter;

        return matchesSearch && matchesStatus && matchesAction;
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
            <Badge variant={config.variant} className={`gap-1 ${config.color || ""}`}>
                <Icon className="size-3" />
                {config.label}
            </Badge>
        );
    };

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="relative flex-1 md:max-w-sm">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
                    <Input
                        placeholder="Search by customer, bot, or symbol..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 border-slate-200 bg-white focus:border-teal-500 focus:ring-teal-500 rounded-lg shadow-sm"
                    />
                </div>

                <div className="flex gap-2">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[140px] border-slate-200 bg-white focus:border-teal-500 focus:ring-teal-500 rounded-lg shadow-sm font-medium">
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
                        <SelectTrigger className="w-[140px] border-slate-200 bg-white focus:border-teal-500 focus:ring-teal-500 rounded-lg shadow-sm font-medium">
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
                </div>
            </div>

            {/* Table */}
            <div className="rounded-xl border border-slate-200 overflow-hidden shadow-md bg-white">
                <Table>
                    <TableHeader className="bg-gradient-to-r from-slate-50 to-slate-100">
                        <TableRow className="border-b-2 border-slate-200 hover:bg-slate-100">
                            <TableHead className="font-bold text-slate-900 py-4">Customer</TableHead>
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
                                        ? "No signals found"
                                        : "No signals match your filters"}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredSignals.map((signal) => {
                                const isUpdating = updatingSignalId === signal.id;
                                return (
                                    <TableRow
                                        key={signal.id}
                                        className={`border-b border-slate-100 transition-all duration-200 hover:bg-slate-50 ${isUpdating ? "opacity-60" : ""}`}
                                    >
                                        <TableCell className="py-4">
                                            <div>
                                                <div className="font-semibold text-slate-900">{signal.customerName}</div>
                                                <div className="text-xs text-slate-500">
                                                    {signal.customerEmail}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <span className="font-medium text-slate-800">{signal.botName}</span>
                                        </TableCell>
                                        <TableCell className="py-4">{getActionBadge(signal.action)}</TableCell>
                                        <TableCell className="py-4">
                                            <Badge variant="outline" className="border-slate-300 font-semibold">{signal.symbol}</Badge>
                                        </TableCell>
                                        <TableCell className="py-4 text-slate-700 font-medium">
                                            {signal.price ? `$${signal.price.toFixed(2)}` : "-"}
                                        </TableCell>
                                        <TableCell className="py-4">
                                            {signal.error ? (
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger>
                                                            <Badge variant="destructive" className="bg-red-500 hover:bg-red-600 shadow-sm cursor-help">Error</Badge>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p className="max-w-xs">{signal.error}</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
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
                                                {isUpdating && <Loader2 className="size-4 animate-spin text-teal-600" />}
                                                <Switch
                                                    checked={signal.visibleToCustomer}
                                                    onCheckedChange={() =>
                                                        handleVisibilityToggle(signal.id, signal.visibleToCustomer)
                                                    }
                                                    className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-teal-600 data-[state=checked]:to-cyan-600 cursor-pointer"
                                                    disabled={isUpdating}
                                                />
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4 text-sm text-slate-600 font-medium">
                                            {new Date(signal.createdAt).toLocaleString()}
                                        </TableCell>
                                        <TableCell className="text-right py-4">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="hover:bg-teal-50 hover:text-teal-700 rounded-lg transition-colors cursor-pointer"
                                                        disabled={isUpdating}
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
                                                        Edit Signal
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => setSelectedSignalForDelete(signal)}
                                                        className="text-red-600 focus:bg-red-50 focus:text-red-700 cursor-pointer rounded-md font-medium"
                                                    >
                                                        <Trash2 className="mr-2 size-4" />
                                                        Delete Signal
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
