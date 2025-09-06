"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Info } from "lucide-react";

interface ValidationWarningsProps {
  hasAdjustments: boolean;
  adjustments: string[];
  adjustedQuantity?: number;
  originalQuantity?: number;
}

export function ValidationWarnings({
  hasAdjustments,
  adjustments,
  adjustedQuantity,
  originalQuantity,
}: ValidationWarningsProps) {
  if (!hasAdjustments || adjustments.length === 0) {
    return null;
  }

  const quantityChanged = originalQuantity !== undefined && 
                          adjustedQuantity !== undefined && 
                          Math.abs(originalQuantity - adjustedQuantity) > 1e-8;

  return (
    <Alert className="border-amber-200 bg-amber-50">
      <AlertTriangle className="h-4 w-4 text-amber-600" />
      <AlertDescription className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-amber-800">
            Exchange Filter Adjustments
          </span>
          {quantityChanged && (
            <Badge variant="outline" className="text-xs">
              {originalQuantity?.toFixed(8)} → {adjustedQuantity?.toFixed(8)}
            </Badge>
          )}
        </div>
        <ul className="text-xs text-amber-700 space-y-1">
          {adjustments.map((adjustment, index) => (
            <li key={index} className="flex items-start gap-1">
              <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <span>{adjustment}</span>
            </li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}
