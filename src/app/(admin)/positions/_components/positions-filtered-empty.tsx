/**
 * Positions Filtered Empty State
 * 
 * Display when no positions match the current filters
 */

"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Filter, X } from "lucide-react";

interface PositionsFilteredEmptyProps {
    onClearFilters?: () => void;
}

export function PositionsFilteredEmpty({ onClearFilters }: PositionsFilteredEmptyProps) {
    return (
        <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="rounded-full bg-muted p-6 mb-4">
                    <Filter className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No Positions Found</h3>
                <p className="text-muted-foreground text-center mb-6">
                    No positions match your current filters. Try adjusting your search criteria.
                </p>
                {onClearFilters && (
                    <Button onClick={onClearFilters} variant="outline">
                        <X className="mr-2 h-4 w-4" />
                        Clear All Filters
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}
