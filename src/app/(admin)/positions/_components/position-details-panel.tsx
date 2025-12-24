/**
 * Position Details Panel Component
 * 
 * Displays expanded position details using the modular PositionCard.
 */

"use client";

import { PositionWithRelations } from "@/features/position";
import { PositionCard } from "./position-card";

interface PositionDetailsPanelProps {
    position: PositionWithRelations;
    currentPrice?: number;
}

export function PositionDetailsPanel({
    position,
    currentPrice,
}: PositionDetailsPanelProps) {
    return (
        <div className="p-4 bg-slate-50/30">
            <PositionCard position={position} currentPrice={currentPrice} />
        </div>
    );
}
