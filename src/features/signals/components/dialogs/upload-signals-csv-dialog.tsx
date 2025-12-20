"use client";

import { useState, useRef } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { BotWithExchange } from "@/features/signal-bot";
import { Upload, Download, CheckCircle2, XCircle, AlertCircle, Loader2 } from "lucide-react";
import Papa from "papaparse";
import { useBulkCreateSignalsMutation } from "../../hooks/use-signal-mutations";

interface UploadSignalsCsvDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    userId: string;
    bots: BotWithExchange[];
    onSuccess?: () => void;
}

interface CsvRow {
    botName: string;
    action: string;
    symbol: string;
    price: string;
    message: string;
}

interface ParsedSignal extends CsvRow {
    rowNumber: number;
    isValid: boolean;
    errors: string[];
    botId?: string;
}

const VALID_ACTIONS = ["ENTER_LONG", "EXIT_LONG", "ENTER_SHORT", "EXIT_SHORT"];

export function UploadSignalsCsvDialog({
    open,
    onOpenChange,
    bots,
    onSuccess,
}: UploadSignalsCsvDialogProps) {
    const [file, setFile] = useState<File | null>(null);
    const [parsedSignals, setParsedSignals] = useState<ParsedSignal[]>([]);
    const [uploadResults, setUploadResults] = useState<{
        created: number;
        failed: number;
        errors: Array<{ row: number; error: string }>;
    } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const bulkCreateMutation = useBulkCreateSignalsMutation();

    const handleDownloadTemplate = () => {
        const link = document.createElement("a");
        link.href = "/templates/signals-upload-example.csv";
        link.download = "signals-upload-example.csv";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Template downloaded");
    };

    const validateRow = (row: CsvRow, rowNumber: number): ParsedSignal => {
        const errors: string[] = [];
        let botId: string | undefined;

        if (!row.botName || !row.botName.trim()) {
            errors.push("Bot name is required");
        } else {
            const bot = bots.find(
                (b) => b.name.toLowerCase() === row.botName.trim().toLowerCase()
            );
            if (!bot) {
                errors.push(`Bot "${row.botName}" not found`);
            } else {
                botId = bot.id;
            }
        }

        if (!row.action || !row.action.trim()) {
            errors.push("Action is required");
        } else {
            const action = row.action.trim().toUpperCase();
            if (!VALID_ACTIONS.includes(action)) {
                errors.push(
                    `Invalid action "${row.action}". Must be one of: ${VALID_ACTIONS.join(", ")}`
                );
            }
        }

        if (!row.symbol || !row.symbol.trim()) {
            errors.push("Symbol is required");
        }

        if (row.price && row.price.trim()) {
            const price = parseFloat(row.price);
            if (isNaN(price) || price <= 0) {
                errors.push("Price must be a positive number");
            }
        }

        return {
            ...row,
            rowNumber,
            isValid: errors.length === 0,
            errors,
            botId,
        };
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0];
        if (!selectedFile) return;

        if (!selectedFile.name.endsWith(".csv")) {
            toast.error("Please select a CSV file");
            return;
        }

        setFile(selectedFile);
        setUploadResults(null);

        Papa.parse<CsvRow>(selectedFile, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                if (results.errors.length > 0) {
                    toast.error("Error parsing CSV file");
                    return;
                }

                if (results.data.length === 0) {
                    toast.error("CSV file is empty");
                    return;
                }

                const validated = results.data.map((row, index) =>
                    validateRow(row, index + 1)
                );

                setParsedSignals(validated);
                const validCount = validated.filter((s) => s.isValid).length;
                const invalidCount = validated.filter((s) => !s.isValid).length;

                toast.success(
                    `Parsed ${results.data.length} rows: ${validCount} valid, ${invalidCount} invalid`
                );
            },
            error: (error) => {
                toast.error("Failed to parse CSV file");
                console.error("CSV parse error:", error);
            },
        });
    };

    const handleUpload = async () => {
        const validSignals = parsedSignals.filter((s) => s.isValid);

        if (validSignals.length === 0) {
            toast.error("No valid signals to upload");
            return;
        }

        try {
            const signalsData = validSignals.map((signal) => ({
                botId: signal.botId!,
                action: signal.action.trim().toUpperCase() as any,
                symbol: signal.symbol.trim().toUpperCase(),
                price: signal.price && signal.price.trim() ? parseFloat(signal.price) : undefined,
                message: signal.message && signal.message.trim() ? signal.message.trim() : undefined,
                visibleToCustomer: true,
            }));

            const result = await bulkCreateMutation.mutateAsync({ signals: signalsData });

            if (result.success) {
                const castedResult = result as any;
                setUploadResults({
                    created: castedResult.created || 0,
                    failed: castedResult.failed || 0,
                    errors: castedResult.errors || [],
                });

                if ((castedResult.created || 0) > 0) {
                    toast.success(`Successfully created ${castedResult.created} signals`);
                    if (onSuccess) onSuccess();
                }

                if ((castedResult.failed || 0) > 0) {
                    toast.error(`Failed to create ${castedResult.failed} signals`);
                }

                if ((castedResult.created || 0) > 0 && (castedResult.failed || 0) === 0) {
                    setTimeout(() => {
                        handleReset();
                        onOpenChange(false);
                    }, 2000);
                }
            } else {
                toast.error(result.error || "Failed to upload signals");
            }
        } catch (error) {
            console.error("Error uploading signals:", error);
        }
    };

    const handleReset = () => {
        setFile(null);
        setParsedSignals([]);
        setUploadResults(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const validCount = parsedSignals.filter((s) => s.isValid).length;
    const invalidCount = parsedSignals.filter((s) => !s.isValid).length;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl border-slate-200">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-slate-900">Upload Signals CSV</DialogTitle>
                    <DialogDescription className="text-slate-500">
                        Batch upload trading signals. Download our template to ensure correct formatting.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="csv-file" className="font-semibold text-slate-700">Select CSV File</Label>
                        <div className="flex gap-3">
                            <Input
                                id="csv-file"
                                ref={fileInputRef}
                                type="file"
                                accept=".csv"
                                onChange={handleFileChange}
                                disabled={bulkCreateMutation.isPending}
                                className="rounded-xl border-slate-200"
                            />
                            <Button
                                variant="outline"
                                onClick={handleDownloadTemplate}
                                disabled={bulkCreateMutation.isPending}
                                className="rounded-xl border-slate-200"
                            >
                                <Download className="mr-2 size-4" />
                                Template
                            </Button>
                        </div>
                    </div>

                    {parsedSignals.length > 0 && (
                        <div className="flex flex-wrap gap-4 animate-in fade-in slide-in-from-top-2">
                            <div className="flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-100 px-4 py-2">
                                <span className="text-sm font-medium text-slate-500">Total:</span>
                                <span className="font-bold text-slate-900">{parsedSignals.length}</span>
                            </div>
                            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-2">
                                <CheckCircle2 className="size-4 text-emerald-500" />
                                <span className="text-sm font-medium text-emerald-600">Valid:</span>
                                <span className="font-bold text-emerald-700">{validCount}</span>
                            </div>
                            <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-100 px-4 py-2">
                                <XCircle className="size-4 text-rose-500" />
                                <span className="text-sm font-medium text-rose-600">Invalid:</span>
                                <span className="font-bold text-rose-700">{invalidCount}</span>
                            </div>
                        </div>
                    )}

                    {uploadResults && (
                        <div className="rounded-2xl border border-teal-100 bg-teal-50/50 p-5 animate-in zoom-in-95">
                            <div className="flex items-center gap-2 mb-3">
                                <AlertCircle className="size-5 text-teal-600" />
                                <h4 className="font-bold text-teal-900">Upload Summary</h4>
                            </div>
                            <div className="grid gap-3 text-sm">
                                <p className="text-teal-700 font-medium">
                                    Successfully created <span className="font-bold">{uploadResults.created}</span> signals.
                                </p>
                                {uploadResults.failed > 0 && (
                                    <div className="mt-2 p-3 bg-white/50 rounded-xl border border-teal-100">
                                        <p className="text-rose-600 font-bold mb-2">✗ Failed to create {uploadResults.failed} signals:</p>
                                        <div className="max-h-32 overflow-y-auto space-y-1">
                                            {uploadResults.errors.map((err, idx) => (
                                                <p key={idx} className="text-rose-500 text-xs">
                                                    Row {err.row}: {err.error}
                                                </p>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {parsedSignals.length > 0 && (
                        <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                            <div className="max-h-[350px] overflow-auto">
                                <Table>
                                    <TableHeader className="bg-slate-50 sticky top-0 z-10">
                                        <TableRow>
                                            <TableHead className="w-12 text-center">#</TableHead>
                                            <TableHead className="w-16">Status</TableHead>
                                            <TableHead>Bot</TableHead>
                                            <TableHead>Action</TableHead>
                                            <TableHead>Symbol</TableHead>
                                            <TableHead>Price</TableHead>
                                            <TableHead>Errors</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {parsedSignals.map((signal, index) => (
                                            <TableRow key={index} className={signal.isValid ? "" : "bg-rose-50/30"}>
                                                <TableCell className="text-center font-mono text-xs text-slate-400">
                                                    {signal.rowNumber}
                                                </TableCell>
                                                <TableCell>
                                                    {signal.isValid ? (
                                                        <div className="size-6 rounded-full bg-emerald-100 flex items-center justify-center">
                                                            <CheckCircle2 className="size-4 text-emerald-600" />
                                                        </div>
                                                    ) : (
                                                        <div className="size-6 rounded-full bg-rose-100 flex items-center justify-center">
                                                            <XCircle className="size-4 text-rose-600" />
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell className="font-semibold text-slate-700">{signal.botName}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className={`font-bold ${signal.isValid
                                                        ? signal.action.includes('LONG') ? "border-emerald-200 text-emerald-700 bg-emerald-50" : "border-rose-200 text-rose-700 bg-rose-50"
                                                        : "border-slate-200 text-slate-400"
                                                        }`}>
                                                        {signal.action}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="font-mono font-bold text-slate-600">{signal.symbol}</TableCell>
                                                <TableCell className="text-slate-500">{signal.price || "Market"}</TableCell>
                                                <TableCell>
                                                    {signal.errors.map((error, idx) => (
                                                        <p key={idx} className="text-[10px] font-medium text-rose-600 leading-tight">
                                                            • {error}
                                                        </p>
                                                    ))}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2 sm:justify-end">
                    <Button
                        variant="ghost"
                        onClick={() => {
                            handleReset();
                            onOpenChange(false);
                        }}
                        disabled={bulkCreateMutation.isPending}
                        className="rounded-xl font-semibold text-slate-500"
                    >
                        Cancel
                    </Button>
                    {parsedSignals.length > 0 && (
                        <Button
                            variant="outline"
                            onClick={handleReset}
                            disabled={bulkCreateMutation.isPending}
                            className="rounded-xl border-slate-200 font-semibold"
                        >
                            Clear All
                        </Button>
                    )}
                    <Button
                        onClick={handleUpload}
                        disabled={bulkCreateMutation.isPending || validCount === 0}
                        className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold px-8 shadow-lg shadow-slate-200"
                    >
                        {bulkCreateMutation.isPending ? (
                            <span className="flex items-center gap-2">
                                <Loader2 className="size-4 animate-spin" />
                                Processing...
                            </span>
                        ) : (
                            <span className="flex items-center gap-2">
                                <Upload className="size-4" />
                                Upload {validCount} Signals
                            </span>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
