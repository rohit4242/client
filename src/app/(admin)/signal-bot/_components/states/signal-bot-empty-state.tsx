"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Bot, Plus, Zap } from "lucide-react";

interface SignalBotEmptyStateProps {
    onCreateBot: () => void;
}

export function SignalBotEmptyState({ onCreateBot }: SignalBotEmptyStateProps) {
    return (
        <Card className="border-dashed border-2 bg-slate-50/50">
            <CardContent className="flex flex-col items-center justify-center p-16 text-center">
                <div className="relative mb-6">
                    <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
                        <Bot className="h-12 w-12 text-teal-500" />
                    </div>
                    <div className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600 text-white shadow-md">
                        <Zap className="h-4 w-4" />
                    </div>
                </div>

                <h3 className="text-2xl font-bold text-slate-900 mb-2">Deploy Your First Signal Bot</h3>
                <p className="text-slate-600 max-w-lg mb-8 text-base">
                    Automate your trading by connecting TradingView signals to our advanced execution engine.
                    Set your rules, choose your exchange, and let the bot handle the rest.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 items-center">
                    <Button
                        onClick={onCreateBot}
                        size="lg"
                        className="bg-teal-600 hover:bg-teal-700 text-white px-8 h-12 rounded-xl shadow-lg shadow-teal-200 gap-2 font-semibold transition-all hover:scale-105"
                    >
                        <Plus className="h-5 w-5" />
                        Create Your First Bot
                    </Button>

                    <Button variant="ghost" className="text-slate-500 font-medium h-12 px-6 rounded-xl hover:bg-slate-100">
                        View Documentation
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
