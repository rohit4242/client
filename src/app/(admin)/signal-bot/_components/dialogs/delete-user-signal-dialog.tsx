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
import { toast } from "sonner";
import { UserSignal } from "@/db/actions/admin/get-user-signals";
import { AlertTriangle } from "lucide-react";
import axios from "axios";

interface DeleteUserSignalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  signal: UserSignal;
  onSuccess: () => void;
}

export function DeleteUserSignalDialog({
  open,
  onOpenChange,
  signal,
  onSuccess,
}: DeleteUserSignalDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    setIsLoading(true);

    try {
      const response = await axios.delete(`/api/admin/signals/${signal.id}`);

      if (response.data.success) {
        toast.success("Signal deleted successfully");
        onOpenChange(false);
        onSuccess();
      } else {
        throw new Error(response.data.error || "Failed to delete signal");
      }
    } catch (error) {
      console.error("Error deleting signal:", error);
      toast.error(
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : "Failed to delete signal"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-destructive" />
            Delete Signal
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this signal? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          <div className="rounded-lg bg-muted p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Bot:</span>
              <span className="text-sm">{signal.botName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Action:</span>
              <span className="text-sm">{signal.action}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Symbol:</span>
              <span className="text-sm">{signal.symbol}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Created:</span>
              <span className="text-sm">
                {new Date(signal.createdAt).toLocaleString()}
              </span>
            </div>
          </div>

          <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            <strong>Warning:</strong> This will permanently delete the signal from the
            database.
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
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
          >
            {isLoading ? "Deleting..." : "Delete Signal"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

