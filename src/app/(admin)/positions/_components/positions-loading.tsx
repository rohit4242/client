/**
 * Positions Loading Skeleton
 * 
 * Loading state for positions table
 */

"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export function PositionsLoadingSkeleton() {
    return (
        <div className="space-y-4">
            {/* Tabs Skeleton */}
            <div className="flex items-center space-x-2 border-b">
                <Skeleton className="h-10 w-20" />
                <Skeleton className="h-10 w-24" />
            </div>

            {/* Toolbar Skeleton */}
            <div className="flex items-center justify-between">
                <div className="flex gap-2">
                    <Skeleton className="h-10 w-40" />
                    <Skeleton className="h-10 w-32" />
                    <Skeleton className="h-10 w-32" />
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-36" />
                </div>
            </div>

            {/* Table Skeleton */}
            <Card>
                <CardContent className="p-0">
                    <div className="rounded-md border">
                        {/* Table Header */}
                        <div className="border-b bg-muted/50 p-4">
                            <div className="flex items-center gap-4">
                                <Skeleton className="h-4 w-4" />
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-4 w-16" />
                                <Skeleton className="h-4 w-20" />
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-4 w-16" />
                                <Skeleton className="h-4 w-16" />
                                <Skeleton className="h-4 w-20" />
                                <Skeleton className="h-4 w-16" />
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-4 w-16 ml-auto" />
                            </div>
                        </div>

                        {/* Table Rows */}
                        <div className="divide-y">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <div key={i} className="p-4">
                                    <div className="flex items-center gap-4">
                                        <Skeleton className="h-4 w-4" />
                                        <div className="space-y-1">
                                            <Skeleton className="h-4 w-28" />
                                            <Skeleton className="h-3 w-20" />
                                        </div>
                                        <Skeleton className="h-5 w-14" />
                                        <Skeleton className="h-4 w-20" />
                                        <Skeleton className="h-4 w-20" />
                                        <Skeleton className="h-4 w-16" />
                                        <Skeleton className="h-4 w-16" />
                                        <Skeleton className="h-4 w-20" />
                                        <Skeleton className="h-5 w-14" />
                                        <Skeleton className="h-4 w-24" />
                                        <div className="ml-auto flex gap-2">
                                            <Skeleton className="h-8 w-8 rounded" />
                                            <Skeleton className="h-8 w-8 rounded" />
                                            <Skeleton className="h-8 w-8 rounded" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
