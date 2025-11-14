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
import { SignalBot } from "@/types/signal-bot";
import { Upload, Download, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import Papa from "papaparse";
import axios from "axios";

interface UploadSignalsCsvDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  bots: SignalBot[];
  onSuccess: () => void;
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
  userId,
  bots,
  onSuccess,
}: UploadSignalsCsvDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedSignals, setParsedSignals] = useState<ParsedSignal[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState<{
    created: number;
    failed: number;
    errors: Array<{ row: number; error: string }>;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadTemplate = () => {
    // Create a link to download the template
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

    // Validate bot name
    if (!row.botName || !row.botName.trim()) {
      errors.push("Bot name is required");
    } else {
      // Find bot by name (case-insensitive)
      const bot = bots.find(
        (b) => b.name.toLowerCase() === row.botName.trim().toLowerCase()
      );
      if (!bot) {
        errors.push(`Bot "${row.botName}" not found`);
      } else {
        botId = bot.id;
      }
    }

    // Validate action
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

    // Validate symbol
    if (!row.symbol || !row.symbol.trim()) {
      errors.push("Symbol is required");
    }

    // Validate price (optional, but must be positive if provided)
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
    if (!selectedFile) {
      return;
    }

    if (!selectedFile.name.endsWith(".csv")) {
      toast.error("Please select a CSV file");
      return;
    }

    setFile(selectedFile);
    setUploadResults(null);

    // Parse CSV
    Papa.parse<CsvRow>(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          toast.error("Error parsing CSV file");
          console.error("CSV parse errors:", results.errors);
          return;
        }

        if (results.data.length === 0) {
          toast.error("CSV file is empty");
          return;
        }

        // Validate each row
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

    setIsUploading(true);

    try {
      // Prepare signals data for upload
      const signalsData = validSignals.map((signal) => ({
        botId: signal.botId!,
        action: signal.action.trim().toUpperCase(),
        symbol: signal.symbol.trim().toUpperCase(),
        price: signal.price && signal.price.trim() ? parseFloat(signal.price) : null,
        message: signal.message && signal.message.trim() ? signal.message.trim() : null,
      }));

      const response = await axios.post(
        `/api/admin/users/${userId}/signals/bulk`,
        { signals: signalsData }
      );

      const results = response.data;
      setUploadResults(results);

      if (results.created > 0) {
        toast.success(
          `Successfully created ${results.created} signal${results.created > 1 ? "s" : ""}`
        );
        onSuccess();
      }

      if (results.failed > 0) {
        toast.error(
          `Failed to create ${results.failed} signal${results.failed > 1 ? "s" : ""}`
        );
      }

      // Reset form after successful upload
      if (results.created > 0 && results.failed === 0) {
        setTimeout(() => {
          handleReset();
          onOpenChange(false);
        }, 2000);
      }
    } catch (error) {
      console.error("Error uploading signals:", error);
      toast.error(
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : "Failed to upload signals"
      );
    } finally {
      setIsUploading(false);
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
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Signals from CSV</DialogTitle>
          <DialogDescription>
            Upload multiple signals at once using a CSV file. Download the template to see the
            required format.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* File Upload Section */}
          <div className="space-y-2">
            <Label htmlFor="csv-file">CSV File</Label>
            <div className="flex gap-2">
              <Input
                id="csv-file"
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                disabled={isUploading}
              />
              <Button
                variant="outline"
                onClick={handleDownloadTemplate}
                disabled={isUploading}
              >
                <Download className="mr-2 size-4" />
                Template
              </Button>
            </div>
            {file && (
              <p className="text-sm text-muted-foreground">
                Selected file: {file.name}
              </p>
            )}
          </div>

          {/* Stats */}
          {parsedSignals.length > 0 && (
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 rounded-lg border px-4 py-2">
                <span className="text-sm text-muted-foreground">Total:</span>
                <span className="font-semibold">{parsedSignals.length}</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-green-500 px-4 py-2">
                <CheckCircle2 className="size-4 text-green-500" />
                <span className="text-sm text-muted-foreground">Valid:</span>
                <span className="font-semibold text-green-600">{validCount}</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-red-500 px-4 py-2">
                <XCircle className="size-4 text-red-500" />
                <span className="text-sm text-muted-foreground">Invalid:</span>
                <span className="font-semibold text-red-600">{invalidCount}</span>
              </div>
            </div>
          )}

          {/* Upload Results */}
          {uploadResults && (
            <div className="rounded-lg border bg-muted/50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="size-5" />
                <h4 className="font-semibold">Upload Results</h4>
              </div>
              <div className="space-y-1 text-sm">
                <p className="text-green-600">
                  ✓ Successfully created: {uploadResults.created}
                </p>
                {uploadResults.failed > 0 && (
                  <>
                    <p className="text-red-600">✗ Failed: {uploadResults.failed}</p>
                    {uploadResults.errors.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <p className="font-medium">Errors:</p>
                        {uploadResults.errors.map((err, idx) => (
                          <p key={idx} className="text-red-600 text-xs">
                            Row {err.row}: {err.error}
                          </p>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Preview Table */}
          {parsedSignals.length > 0 && (
            <div className="rounded-md border max-h-[400px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Row</TableHead>
                    <TableHead className="w-16">Status</TableHead>
                    <TableHead>Bot Name</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Symbol</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Errors</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedSignals.map((signal, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono text-xs">
                        {signal.rowNumber}
                      </TableCell>
                      <TableCell>
                        {signal.isValid ? (
                          <CheckCircle2 className="size-4 text-green-500" />
                        ) : (
                          <XCircle className="size-4 text-red-500" />
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{signal.botName}</TableCell>
                      <TableCell>
                        <Badge
                          variant={signal.isValid ? "default" : "outline"}
                          className={
                            signal.isValid
                              ? signal.action === "ENTER_LONG"
                                ? "bg-green-500"
                                : signal.action === "EXIT_LONG"
                                ? "bg-blue-500"
                                : signal.action === "ENTER_SHORT"
                                ? "bg-red-500"
                                : "bg-orange-500"
                              : ""
                          }
                        >
                          {signal.action}
                        </Badge>
                      </TableCell>
                      <TableCell>{signal.symbol}</TableCell>
                      <TableCell>{signal.price || "-"}</TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {signal.message || "-"}
                      </TableCell>
                      <TableCell>
                        {signal.errors.length > 0 && (
                          <div className="space-y-1">
                            {signal.errors.map((error, idx) => (
                              <p key={idx} className="text-xs text-red-600">
                                {error}
                              </p>
                            ))}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              handleReset();
              onOpenChange(false);
            }}
            disabled={isUploading}
          >
            Cancel
          </Button>
          {parsedSignals.length > 0 && (
            <Button variant="outline" onClick={handleReset} disabled={isUploading}>
              Reset
            </Button>
          )}
          <Button
            onClick={handleUpload}
            disabled={isUploading || validCount === 0}
          >
            <Upload className="mr-2 size-4" />
            {isUploading
              ? "Uploading..."
              : `Upload ${validCount} Signal${validCount !== 1 ? "s" : ""}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

