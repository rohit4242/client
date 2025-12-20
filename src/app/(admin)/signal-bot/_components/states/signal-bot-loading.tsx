"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function SignalBotLoading() {
    return (
        <div className="space-y-6 pb-20">
            {/* Header Skeleton - Matches new premium header */}
            <div className="flex items-center justify-between pb-6 border-b border-slate-200">
                <div className="flex items-center gap-4">
                    <Skeleton className="size-14 rounded-xl" />
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-4 w-64" />
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-28" />
                </div>
            </div>

            <div className="space-y-8 mt-6">
                {/* Stats Skeleton */}
                <section>
                    <div className="mb-4">
                        <Skeleton className="h-7 w-48" />
                    </div>
                    <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <Card key={i} className="border-slate-200/60 shadow-sm overflow-hidden bg-white">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-2">
                                            <Skeleton className="h-3 w-20" />
                                            <Skeleton className="h-8 w-16" />
                                        </div>
                                        <Skeleton className="size-12 rounded-2xl" />
                                    </div>
                                    <div className="mt-4 flex items-center gap-2">
                                        <Skeleton className="size-1 rounded-full" />
                                        <Skeleton className="h-3 w-32" />
                                    </div>
                                </CardContent>
                                <Skeleton className="h-1 w-full opacity-20 bg-teal-500" />
                            </Card>
                        ))}
                    </div>
                </section>

                {/* List Skeleton */}
                <section>
                    <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
                        <Skeleton className="h-7 w-32" />
                        <Skeleton className="h-4 w-24" />
                    </div>
                    <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 auto-rows-fr">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <Card key={i} className="border-slate-200/60 shadow-sm overflow-hidden flex flex-col h-full bg-white relative">
                                <div className="absolute top-0 left-0 w-full h-1 bg-teal-100" />

                                <div className="p-4 border-b border-slate-50">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <Skeleton className="h-12 w-12 rounded-xl" />
                                            <div className="space-y-1.5">
                                                <Skeleton className="h-5 w-32" />
                                                <Skeleton className="h-3 w-40" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 mt-4">
                                        {Array.from({ length: 4 }).map((_, j) => (
                                            <div key={j} className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                                                <Skeleton className="h-3 w-12" />
                                                <Skeleton className="h-6 w-20" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}
