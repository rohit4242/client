"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface BotStatusBadgeProps {
    active: boolean;
    className?: string;
}

export function BotStatusBadge({ active, className }: BotStatusBadgeProps) {
    return (
        <Badge
            variant={active ? "default" : "secondary"}
            className={cn(
                "font-medium",
                active && "bg-emerald-500 hover:bg-emerald-600 text-white border-none",
                className
            )}
        >
            <div className={cn(
                "mr-1.5 h-1.5 w-1.5 rounded-full",
                active ? "bg-white animate-pulse" : "bg-muted-foreground"
            )} />
            {active ? "Active" : "Inactive"}
        </Badge>
    );
}
