"use client";

import { useMemo } from "react";
import { PositionWithRelations, calculatePositionPnl } from "../schemas/position.schema";
import { useRealtimePrice } from "@/features/binance/client";

interface UsePositionMetricsOptions {
    position: PositionWithRelations;
    overridePrice?: number;
}

export function usePositionMetrics({ position, overridePrice }: UsePositionMetricsOptions) {
    // Use real-time price hook from features/binance
    const { price: livePrice, isLive } = useRealtimePrice(position.symbol, {
        exchangeId: position.exchange.id,
        enabled: position.status === "OPEN",
    });

    // Priority: passed overridePrice > live price > position.currentPrice > entryPrice as fallback
    const effectivePrice = useMemo(() => {
        if (overridePrice !== undefined && overridePrice !== null) return overridePrice;
        if (livePrice) return parseFloat(livePrice);
        return position.currentPrice || position.entryPrice;
    }, [overridePrice, livePrice, position.currentPrice, position.entryPrice]);

    // Recalculate P/L with live price for open positions
    const pnlData = useMemo(() => {
        return calculatePositionPnl({
            side: position.side,
            entryPrice: position.entryPrice,
            entryValue: position.entryValue,
            currentPrice: effectivePrice,
            exitPrice: position.exitPrice,
            quantity: position.quantity,
            status: position.status,
            pnl: position.pnl,
        });
    }, [
        position.side,
        position.entryPrice,
        position.entryValue,
        effectivePrice,
        position.exitPrice,
        position.quantity,
        position.status,
        position.pnl,
    ]);

    return {
        effectivePrice,
        pnlData,
        isLive,
        symbol: position.symbol,
        exchangeName: position.exchange.name,
    };
}
