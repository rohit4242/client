/**
 * Positions Error State
 * 
 * Display when positions fail to load
 */

"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface PositionsErrorStateProps {
    error?: Error | unknown;
    onRetry?: () => void;
}

export function PositionsErrorState({ error, onRetry }: PositionsErrorStateProps) {
    const errorMessage = error instanceof Error
        ? error.message
        : "An unexpected error occurred while loading positions.";

    return (
        <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="rounded-full bg-destructive/10 p-6 mb-4">
                    <AlertTriangle className="h-12 w-12 text-destructive" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-destructive">Failed to Load Positions</h3>
                <p className="text-muted-foreground text-center mb-6 max-w-md">
                    {errorMessage}
                </p>
                {onRetry && (
                    <Button onClick={onRetry} variant="outline">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Try Again
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}
