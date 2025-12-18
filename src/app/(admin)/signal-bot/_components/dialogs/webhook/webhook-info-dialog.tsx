"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Copy,
    Globe,
    Code2,
    CheckCircle2,
    Send,
    Loader2,
    Activity,
    Terminal
} from "lucide-react";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { getSignals, type BotWithExchange } from "@/features/signal-bot";

interface WebhookInfoDialogProps {
    bot: BotWithExchange;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function WebhookInfoDialog({ bot, open, onOpenChange }: WebhookInfoDialogProps) {
    const copyToClipboard = async (text: string, label: string) => {
        try {
            await navigator.clipboard.writeText(text);
            toast.success(`${label} copied!`, {
                description: "Ready to paste in TradingView or your API client."
            });
        } catch {
            toast.error(`Failed to copy ${label}`);
        }
    };

    const webhookUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/api/webhook/signal-bot/${bot.id}`;

    const { data: signalData, isLoading: loadingSignals } = useQuery({
        queryKey: ["bot-recent-signals", bot.id],
        queryFn: () => getSignals({ botId: bot.id, limit: 5 }),
        enabled: open,
    });

    const recentSignals = signalData?.signals || [];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 gap-0 border-none bg-slate-50 dark:bg-slate-950">
                <div className="p-6 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                    <DialogHeader>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg">
                                <Globe className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div>
                                <DialogTitle className="text-2xl font-black">Webhook Integration</DialogTitle>
                                <DialogDescription className="font-medium">
                                    Configuring <span className="text-indigo-600 dark:text-indigo-400 font-bold">{bot.name}</span> for external automation.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                </div>

                <div className="p-6">
                    <Tabs defaultValue="setup" className="w-full">
                        <TabsList className="w-full mb-6 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl h-11 border border-slate-200 dark:border-slate-800">
                            <TabsTrigger value="setup" className="flex-1 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm font-bold text-xs uppercase tracking-wider">Setup</TabsTrigger>
                            <TabsTrigger value="payload" className="flex-1 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm font-bold text-xs uppercase tracking-wider">Payloads</TabsTrigger>
                            <TabsTrigger value="activity" className="flex-1 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm font-bold text-xs uppercase tracking-wider">Recent Activity</TabsTrigger>
                        </TabsList>

                        <TabsContent value="setup" className="space-y-6 focus-visible:outline-none">
                            <div className="space-y-4">
                                <h4 className="text-sm font-black uppercase tracking-widest text-slate-400">Connection Endpoint</h4>
                                <div className="flex items-center gap-2 group">
                                    <div className="flex-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 font-mono text-xs break-all relative overflow-hidden">
                                        <div className="absolute left-0 top-0 w-1 h-full bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        {webhookUrl}
                                    </div>
                                    <Button
                                        size="icon"
                                        variant="outline"
                                        className="h-[52px] w-[52px] rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-950"
                                        onClick={() => copyToClipboard(webhookUrl, "Webhook URL")}
                                    >
                                        <Copy className="h-5 w-5" />
                                    </Button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FeatureCard
                                    icon={CheckCircle2}
                                    title="TradingView Ready"
                                    description="Paste this URL directly into your alert webhook settings."
                                    color="teal"
                                />
                                <FeatureCard
                                    icon={Terminal}
                                    title="Universal API"
                                    description="Supports JSON and Underscore-separated plain text formats."
                                    color="indigo"
                                />
                            </div>

                            <div className="bg-indigo-600 text-white rounded-2xl p-6 shadow-xl shadow-indigo-200 dark:shadow-indigo-950/20">
                                <h4 className="font-bold mb-2 flex items-center gap-2">
                                    <Activity className="h-5 w-5" /> Quick Checklist
                                </h4>
                                <ul className="space-y-2 text-indigo-100 text-sm font-medium">
                                    <li className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-white" /> Ensure Bot is toggled ACTIVE</li>
                                    <li className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-white" /> Symbol in payload must match bot config</li>
                                    <li className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-white" /> Price is optional (Market price used by default)</li>
                                </ul>
                            </div>
                        </TabsContent>

                        <TabsContent value="payload" className="space-y-6 focus-visible:outline-none">
                            <Accordion type="single" collapsible className="w-full space-y-3">
                                <PayloadItem
                                    title="Recommended: TradingView Message"
                                    description="Use the underscore format for maximum compatibility."
                                    content={`ENTER-LONG_BINANCE_${bot.symbols[0]}_${bot.name}_4M_${bot.id}`}
                                    onCopy={() => copyToClipboard(`ENTER-LONG_BINANCE_${bot.symbols[0]}_${bot.name}_4M_${bot.id}`, "Payload")}
                                />
                                <PayloadItem
                                    title="Standard JSON Format"
                                    description="Clean and structured data for custom applications."
                                    content={JSON.stringify({
                                        action: "ENTER_LONG",
                                        symbol: bot.symbols[0],
                                        price: 45000,
                                        message: "Manual test signal"
                                    }, null, 2)}
                                    language="json"
                                    onCopy={() => copyToClipboard(JSON.stringify({
                                        action: "ENTER_LONG",
                                        symbol: bot.symbols[0],
                                        price: 45000,
                                        message: "Manual test signal"
                                    }, null, 2), "JSON Payload")}
                                />
                            </Accordion>
                        </TabsContent>

                        <TabsContent value="activity" className="space-y-4 focus-visible:outline-none">
                            {loadingSignals ? (
                                <div className="space-y-3">
                                    {[1, 2, 3].map(i => <div key={i} className="h-16 bg-slate-100 dark:bg-slate-900 rounded-xl animate-pulse" />)}
                                </div>
                            ) : recentSignals.length > 0 ? (
                                <div className="space-y-3">
                                    {recentSignals.map((signal: any) => (
                                        <div key={signal.id} className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <Badge className={`${signal.action.includes('LONG') ? 'bg-teal-500' : 'bg-rose-500'} font-bold`}>{signal.action}</Badge>
                                                <span className="font-mono text-sm font-bold">{signal.symbol}</span>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{new Date(signal.createdAt).toLocaleString()}</span>
                                                {signal.error ? (
                                                    <Badge variant="destructive" title={signal.error}>ERROR</Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-teal-600 border-teal-200">SUCCESS</Badge>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 p-6 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                                    <Activity className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                                    <h3 className="font-bold text-slate-900 dark:text-slate-100">No Webhook Activity Yet</h3>
                                    <p className="text-sm text-slate-500 mt-1">Signals will appear here as soon as they are received.</p>
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </div>

                <div className="p-6 bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                    <Button variant="outline" onClick={() => onOpenChange(false)} className="font-bold">Close Window</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function FeatureCard({ icon: Icon, title, description, color }: any) {
    const colors: any = {
        teal: "text-teal-600 bg-teal-50 dark:bg-teal-950/30",
        indigo: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30",
    };
    return (
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className={`p-2 w-fit rounded-lg mb-3 ${colors[color]}`}>
                <Icon className="h-5 w-5" />
            </div>
            <h4 className="font-bold text-sm mb-1">{title}</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
        </div>
    );
}

function PayloadItem({ title, description, content, onCopy, language = "text" }: any) {
    return (
        <AccordionItem value={title} className="border border-slate-200 dark:border-slate-800 rounded-2xl p-0 px-4 bg-white dark:bg-slate-900 overflow-hidden">
            <AccordionTrigger className="hover:no-underline py-4">
                <div className="text-left">
                    <p className="text-sm font-black">{title}</p>
                    <p className="text-xs text-muted-foreground font-medium mt-0.5">{description}</p>
                </div>
            </AccordionTrigger>
            <AccordionContent className="pb-4">
                <div className="relative group">
                    <pre className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl font-mono text-xs overflow-x-auto border border-slate-100 dark:border-slate-800">
                        {content}
                    </pre>
                    <Button
                        size="sm"
                        variant="secondary"
                        className="absolute right-2 top-2 h-8 font-bold text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={onCopy}
                    >
                        <Copy className="h-3 w-3 mr-1.5" /> Copy Code
                    </Button>
                </div>
            </AccordionContent>
        </AccordionItem>
    );
}
