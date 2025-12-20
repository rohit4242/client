"use client";

import { useState, useEffect } from "react";
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { SignalWithBot, useUpdateSignalMutation } from "../../index";
import { Loader2 } from "lucide-react";

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
    const [action, setAction] = useState<string>(signal.action);
    const [symbol, setSymbol] = useState(signal.symbol);
    const [price, setPrice] = useState(signal.price?.toString() || "");
    const [message, setMessage] = useState(signal.message || "");
    const [processed, setProcessed] = useState(signal.processed);
    const [visibleToCustomer, setVisibleToCustomer] = useState(signal.visibleToCustomer);

    const updateMutation = useUpdateSignalMutation();

    useEffect(() => {
        if (open) {
            setAction(signal.action);
            setSymbol(signal.symbol);
            setPrice(signal.price?.toString() || "");
            setMessage(signal.message || "");
            setProcessed(signal.processed);
            setVisibleToCustomer(signal.visibleToCustomer);
        }
    }, [open, signal]);

    const handleSave = async () => {
        try {
            await updateMutation.mutateAsync({
                id: signal.id,
                action: action as any,
                symbol,
                price: price ? parseFloat(price) : null,
                message,
                processed,
                visibleToCustomer,
            });
            onOpenChange(false);
        } catch (error) {
            console.error("Error saving signal:", error);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] rounded-2xl shadow-2xl border-slate-200">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-slate-900">Edit Trading Signal</DialogTitle>
                    <DialogDescription className="text-slate-500">
                        Modify details for the signal from <span className="font-semibold text-teal-600">{signal.botName}</span>
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="action" className="text-right font-semibold text-slate-700">Action</Label>
                        <Select value={action} onValueChange={setAction}>
                            <SelectTrigger className="col-span-3 border-slate-200 rounded-lg">
                                <SelectValue placeholder="Select action" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ENTER_LONG">Enter Long</SelectItem>
                                <SelectItem value="EXIT_LONG">Exit Long</SelectItem>
                                <SelectItem value="ENTER_SHORT">Enter Short</SelectItem>
                                <SelectItem value="EXIT_SHORT">Exit Short</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="symbol" className="text-right font-semibold text-slate-700">Symbol</Label>
                        <Input
                            id="symbol"
                            value={symbol}
                            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                            className="col-span-3 border-slate-200 rounded-lg"
                            placeholder="BTCUSDT"
                        />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="price" className="text-right font-semibold text-slate-700">Price</Label>
                        <Input
                            id="price"
                            type="number"
                            step="any"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            className="col-span-3 border-slate-200 rounded-lg"
                            placeholder="0.00"
                        />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="message" className="text-right font-semibold text-slate-700">Message</Label>
                        <Textarea
                            id="message"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="col-span-3 border-slate-200 rounded-lg min-h-[80px]"
                            placeholder="Optional message or notes..."
                        />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right font-semibold text-slate-700">Status</Label>
                        <div className="col-span-3 flex items-center gap-6">
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="processed"
                                    checked={processed}
                                    onCheckedChange={setProcessed}
                                    className="data-[state=checked]:bg-teal-600"
                                />
                                <Label htmlFor="processed" className="cursor-pointer font-medium text-slate-600">Processed</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="visible"
                                    checked={visibleToCustomer}
                                    onCheckedChange={setVisibleToCustomer}
                                    className="data-[state=checked]:bg-teal-600"
                                />
                                <Label htmlFor="visible" className="cursor-pointer font-medium text-slate-600">Visible to User</Label>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="rounded-xl border-slate-200"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={updateMutation.isPending}
                        className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white rounded-xl px-8 shadow-md"
                    >
                        {updateMutation.isPending ? (
                            <span className="flex items-center gap-2">
                                <Loader2 className="size-4 animate-spin" />
                                Updating...
                            </span>
                        ) : "Save Changes"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
