
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, AlertCircle } from "lucide-react";

interface PositionsEmptyStateProps {
    type?: "open" | "closed" | "all";
}

export function PositionsEmptyState({ type = "all" }: PositionsEmptyStateProps) {
    const config = {
        open: {
            icon: TrendingUp,
            title: "No Open Positions",
            message: "You don't have any open positions at the moment.",
            suggestion: "Start trading to see your positions here."
        },
        closed: {
            icon: AlertCircle,
            title: "No Position History",
            message: "You don't have any closed positions yet.",
            suggestion: "Positions you close will appear here for tracking and analysis."
        },
        all: {
            icon: TrendingUp,
            title: "No Positions Yet",
            message: "You haven't opened any trading positions.",
            suggestion: "Create a bot or manually place orders to start trading."
        }
    };

    const { icon: Icon, title, message, suggestion } = config[type];

    return (
        <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="rounded-full bg-muted p-6 mb-4">
                    <Icon className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{title}</h3>
                <p className="text-muted-foreground text-center mb-1">{message}</p>
                <p className="text-sm text-muted-foreground text-center mb-6">{suggestion}</p>
            </CardContent>
        </Card>
    );
}
