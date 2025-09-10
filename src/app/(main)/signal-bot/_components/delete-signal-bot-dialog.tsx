"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { SignalBot } from "@/types/signal-bot";

interface DeleteSignalBotDialogProps {
  bot: SignalBot;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function DeleteSignalBotDialog({ bot, open, onOpenChange, onSuccess }: DeleteSignalBotDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteBotMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.delete(`/api/signal-bots/${bot.id}`);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Signal bot deleted successfully!");
      onSuccess();
    },
    onError: (error: AxiosError<{ error: string }>) => {
      toast.error(error.response?.data?.error || "Failed to delete signal bot");
    },
    onSettled: () => {
      setIsDeleting(false);
    },
  });

  const handleDelete = () => {
    setIsDeleting(true);
    deleteBotMutation.mutate();
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Signal Bot</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete &quot;{bot.name}&quot;? This action cannot be undone.
            All associated signals and trade history will be permanently removed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="rounded-lg bg-muted p-4 space-y-2 text-sm">
          <div className="font-medium">Bot Details:</div>
          <div className="space-y-1 text-muted-foreground">
            <div>• Name: {bot.name}</div>
            <div>• Symbol: {bot.symbol}</div>
            <div>• Total Trades: {bot.totalTrades}</div>
            <div>• Status: {bot.isActive ? "Active" : "Inactive"}</div>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "Deleting..." : "Delete Bot"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
