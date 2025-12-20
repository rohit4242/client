"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { BotWithExchange, useToggleBotMutation } from "@/features/signal-bot";
import { SignalBotCardHeader } from "./signal-bot-card-header";
import { SignalBotCardStats } from "./signal-bot-card-stats";
import { SignalBotCardDetails } from "./signal-bot-card-details";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
    EditSignalBotDialog,
    DeleteSignalBotDialog,
    WebhookInfoDialog,
    ManualSignalDialog
} from "../index";

interface SignalBotCardProps {
    bot: BotWithExchange;
    onBotUpdated: () => void;
    userId: string;
}

export function SignalBotCard({ bot, onBotUpdated, userId }: SignalBotCardProps) {
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showWebhookDialog, setShowWebhookDialog] = useState(false);
    const [showManualSignalDialog, setShowManualSignalDialog] = useState(false);

    const toggleBotMutation = useToggleBotMutation();

    const handleToggle = async () => {
        const action = toggleBotMutation.mutateAsync({
            id: bot.id,
            isActive: !bot.isActive
        });

        toast.promise(action, {
            loading: `${bot.isActive ? 'Deactivating' : 'Activating'} bot ${bot.name}...`,
            success: () => {
                onBotUpdated();
                return `${bot.name} ${bot.isActive ? 'deactivated' : 'activated'} successfully.`;
            },
            error: (err: any) => `Failed to toggle bot: ${err.message}`
        });
    };

    return (
        <>
            <Card className={cn(
                "group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col h-full",
                bot.isActive
                    ? "border-teal-100 bg-white"
                    : "border-slate-200 bg-slate-50/50 grayscale-[0.2]"
            )}>
                {/* Activity Glow Effect */}
                {bot.isActive && (
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500" />
                )}

                <CardHeader className="pb-0 pt-4 px-5">
                    <SignalBotCardHeader
                        bot={bot}
                        onToggle={handleToggle}
                        isToggling={toggleBotMutation.isPending}
                        onEdit={() => setShowEditDialog(true)}
                        onDelete={() => setShowDeleteDialog(true)}
                        onWebhook={() => setShowWebhookDialog(true)}
                        onManualSignal={() => setShowManualSignalDialog(true)}
                    />
                </CardHeader>

                <CardContent className="flex-1 flex flex-col px-5 pb-5">
                    <SignalBotCardStats bot={bot} />
                    <SignalBotCardDetails
                        bot={bot}
                        onWebhook={() => setShowWebhookDialog(true)}
                    />
                </CardContent>
            </Card>

            <EditSignalBotDialog
                bot={bot as any}
                open={showEditDialog}
                onOpenChange={setShowEditDialog}
                onSuccess={() => {
                    setShowEditDialog(false);
                    onBotUpdated();
                }}
            />

            <DeleteSignalBotDialog
                bot={bot}
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
                onSuccess={() => {
                    setShowDeleteDialog(false);
                    onBotUpdated();
                }}
            />

            <WebhookInfoDialog
                bot={bot as any}
                open={showWebhookDialog}
                onOpenChange={setShowWebhookDialog}
            />

            <ManualSignalDialog
                open={showManualSignalDialog}
                onOpenChange={setShowManualSignalDialog}
                bot={bot as any}
            />
        </>
    );
}
