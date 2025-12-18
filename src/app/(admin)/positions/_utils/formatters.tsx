/**
 * Positions Formatting Utilities
 * 
 * Centralized helpers for status badges, P&L coloring, and currency formatting.
 */

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Returns a Badge component for the given position status
 */
export const getStatusBadge = (status: string) => {
    const statusConfig = {
        OPEN: {
            color: "bg-green-100 text-green-800 border-green-200",
            label: "OPEN",
        },
        CLOSED: {
            color: "bg-blue-100 text-blue-800 border-blue-200",
            label: "CLOSED",
        },
        CANCELED: {
            color: "bg-red-100 text-red-800 border-red-200",
            label: "CANCELED",
        },
        MARKET_CLOSED: {
            color: "bg-purple-100 text-purple-800 border-purple-200",
            label: "MARKET CLOSED",
        },
        FAILED: {
            color: "bg-red-100 text-red-800 border-red-200",
            label: "FAILED",
        },
        PENDING: {
            color: "bg-yellow-100 text-yellow-800 border-yellow-200",
            label: "PENDING",
        },
        PARTIALLY_FILLED: {
            color: "bg-orange-100 text-orange-800 border-orange-200",
            label: "PARTIAL",
        },
        // Legacy status mapping
        ENTERED: {
            color: "bg-green-100 text-green-800 border-green-200",
            label: "OPEN",
        },
        COMPLETED: {
            color: "bg-blue-100 text-blue-800 border-blue-200",
            label: "CLOSED",
        },
        CANCELLED: {
            color: "bg-red-100 text-red-800 border-red-200",
            label: "CANCELED",
        },
    };

    const config =
        statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;

    return (
        <Badge variant="outline" className={cn("text-xs font-bold", config.color)}>
            {config.label}
        </Badge>
    );
};

/**
 * Returns a CSS class for coloring text based on P&L value
 */
export const getPnLColor = (value: number) => {
    if (value > 0) return "text-green-600";
    if (value < 0) return "text-red-600";
    return "text-gray-600";
};

/**
 * Formats a number as a signed percentage string (e.g., +10.50%)
 */
export const formatPercentage = (value: number) => {
    const sign = value >= 0 ? "+" : "";
    return `${sign}${value.toFixed(2)}%`;
};

/**
 * Formats a number as USD currency
 */
export const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
};
