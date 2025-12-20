"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, RefreshCw, ChevronRight } from "lucide-react";

interface SignalBotErrorStateProps {
    error: Error;
    reset: () => void;
}

export function SignalBotErrorState({ error, reset }: SignalBotErrorStateProps) {
    return (
        <Card className="border-red-100 bg-red-50/30 overflow-hidden">
            <CardContent className="flex flex-col items-center justify-center p-16 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-red-100 mb-6">
                    <AlertCircle className="h-10 w-10 text-red-600" />
                </div>

                <h3 className="text-2xl font-bold text-red-900 mb-3">Unable to Load Signal Bots</h3>
                <p className="text-red-700 max-w-md mb-8 text-base">
                    {error.message || "We encountered an unexpected technical issue while trying to fetch your bots. Please try again or contact support if the problem persists."}
                </p>

                <div className="flex flex-col sm:flex-row gap-4 items-center">
                    <Button
                        onClick={reset}
                        className="bg-red-600 hover:bg-red-700 text-white px-8 h-12 rounded-xl shadow-lg shadow-red-200 gap-2 font-semibold transition-all"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Try Again
                    </Button>

                    <Button
                        variant="outline"
                        onClick={() => window.location.reload()}
                        className="border-red-200 text-red-700 bg-white hover:bg-red-50 h-12 rounded-xl px-6 font-medium gap-2"
                    >
                        Refresh Dashboard
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>

                <div className="mt-12 pt-8 border-t border-red-100 w-full max-w-lg">
                    <p className="text-xs text-red-400 font-mono break-all line-clamp-2">
                        Error ID: {Math.random().toString(36).substr(2, 9).toUpperCase()} | {error.name}: {error.message}
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
