"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { SignalWithBot } from "@/db/actions/admin/get-all-signals";

interface EditSignalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  signal: SignalWithBot;
}

export function EditSignalDialog({
  open,
  onOpenChange,
  signal,
}: EditSignalDialogProps) {
  const [action, setAction] = useState(signal.action);
  const [symbol, setSymbol] = useState(signal.symbol);
  const [price, setPrice] = useState(signal.price?.toString() || "");
  const [message, setMessage] = useState(signal.message || "");
  const [processed, setProcessed] = useState(signal.processed);
  const [visibleToCustomer, setVisibleToCustomer] = useState(signal.visibleToCustomer);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleUpdate = async () => {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/admin/signals/${signal.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          symbol,
          price: price ? parseFloat(price) : null,
          message: message || null,
          processed,
          visibleToCustomer,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update signal");
      }

      toast.success("Signal updated successfully");
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      console.error("Error updating signal:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update signal");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Signal</DialogTitle>
          <DialogDescription>
            Update signal details for {signal.customerName} - {signal.botName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="action">Action</Label>
              <Select value={action} onValueChange={(value: any) => setAction(value)}>
                <SelectTrigger id="action">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ENTER_LONG">Enter Long</SelectItem>
                  <SelectItem value="EXIT_LONG">Exit Long</SelectItem>
                  <SelectItem value="ENTER_SHORT">Enter Short</SelectItem>
                  <SelectItem value="EXIT_SHORT">Exit Short</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="symbol">Symbol</Label>
              <Input
                id="symbol"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                placeholder="BTCUSDT"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Price (Optional)</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Enter price or leave empty"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message (Optional)</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Optional signal message"
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="processed">Processed Status</Label>
              <div className="text-sm text-muted-foreground">
                Mark this signal as processed
              </div>
            </div>
            <Switch
              id="processed"
              checked={processed}
              onCheckedChange={setProcessed}
            />
          </div>

          <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="visible">Visible to Customer</Label>
              <div className="text-sm text-muted-foreground">
                Control whether customer can see this signal
              </div>
            </div>
            <Switch
              id="visible"
              checked={visibleToCustomer}
              onCheckedChange={setVisibleToCustomer}
            />
          </div>

          {signal.error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-200">
              <strong>Error:</strong> {signal.error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={handleUpdate} disabled={isLoading}>
            {isLoading ? "Updating..." : "Update Signal"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

