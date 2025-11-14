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
import { toast } from "sonner";
import { SignalBot } from "@/types/signal-bot";
import { SignalAction } from "@/types/signal-bot";
import axios from "axios";

interface CreateSignalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  bots: SignalBot[];
  onSuccess: () => void;
}

export function CreateSignalDialog({
  open,
  onOpenChange,
  userId,
  bots,
  onSuccess,
}: CreateSignalDialogProps) {
  const [botId, setBotId] = useState("");
  const [action, setAction] = useState<SignalAction>("ENTER_LONG");
  const [symbol, setSymbol] = useState("");
  const [price, setPrice] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async () => {
    if (bots.length === 0) {
      toast.error("No bots available. Please create a signal bot first.");
      return;
    }

    if (!botId) {
      toast.error("Please select a bot");
      return;
    }

    if (!symbol.trim()) {
      toast.error("Please enter a symbol");
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post(`/api/admin/users/${userId}/signals`, {
        botId,
        action,
        symbol: symbol.toUpperCase(),
        price: price ? parseFloat(price) : null,
        message: message.trim() || null,
      });

      if (response.data.success) {
        toast.success("Signal created successfully");
        onOpenChange(false);
        // Reset form
        setBotId("");
        setAction("ENTER_LONG");
        setSymbol("");
        setPrice("");
        setMessage("");
        onSuccess();
      } else {
        throw new Error(response.data.error || "Failed to create signal");
      }
    } catch (error) {
      console.error("Error creating signal:", error);
      toast.error(
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : "Failed to create signal"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Signal</DialogTitle>
          <DialogDescription>
            Create a new trading signal for the selected user
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="bot">Bot *</Label>
            <Select value={botId} onValueChange={setBotId}>
              <SelectTrigger id="bot">
                <SelectValue placeholder="Select a bot" />
              </SelectTrigger>
              <SelectContent>
                {bots.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground text-center">
                    No bots available
                  </div>
                ) : (
                  bots.map((bot) => (
                    <SelectItem key={bot.id} value={bot.id}>
                      {bot.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="action">Action *</Label>
              <Select value={action} onValueChange={(value: SignalAction) => setAction(value)}>
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
              <Label htmlFor="symbol">Symbol *</Label>
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
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={isLoading || !botId || !symbol.trim()}>
            {isLoading ? "Creating..." : "Create Signal"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

