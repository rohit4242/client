"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SignalWithBot, useDeleteSignalMutation } from "../../index";
import { AlertCircle, Loader2, Trash2 } from "lucide-react";

interface DeleteSignalDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    signal: SignalWithBot;
}

export function DeleteSignalDialog({
    open,
    onOpenChange,
    signal,
}: DeleteSignalDialogProps) {
    const deleteMutation = useDeleteSignalMutation();

    const handleDelete = async () => {
        try {
            await deleteMutation.mutateAsync(signal.id);
            onOpenChange(false);
        } catch (error) {
            console.error("Error deleting signal:", error);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[420px] rounded-2xl shadow-2xl border-slate-200">
                <DialogHeader className="flex flex-col items-center pt-4">
                    <div className="size-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                        <Trash2 className="size-8 text-red-600" />
                    </div>
                    <DialogTitle className="text-2xl font-bold text-slate-900">Delete Signal?</DialogTitle>
                    <DialogDescription className="text-center text-slate-600 pt-2">
                        Are you sure you want to delete the <span className="font-bold text-slate-900">{signal.action}</span> signal
                        for <span className="font-bold text-slate-900">{signal.symbol}</span>?
                        This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 mt-4">
                    <AlertCircle className="size-5 text-amber-600 shrink-0" />
                    <p className="text-sm text-amber-800 font-medium">
                        Deleting this signal will remove it from all admin logs and the customer&apos;s dashboard (if it was visible).
                    </p>
                </div>

                <DialogFooter className="gap-2 sm:justify-center mt-6">
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        className="rounded-xl flex-1 font-semibold text-slate-600 hover:bg-slate-100"
                    >
                        Go Back
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={deleteMutation.isPending}
                        className="rounded-xl flex-1 bg-red-600 hover:bg-red-700 font-semibold shadow-md"
                    >
                        {deleteMutation.isPending ? (
                            <span className="flex items-center gap-2">
                                <Loader2 className="size-4 animate-spin" />
                                Deleting...
                            </span>
                        ) : "Confirm Delete"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
