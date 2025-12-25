/**
 * Pagination Controls Component
 * 
 * Reusable pagination UI with page navigation and page size selector
 */

"use client";

import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

interface PaginationControlsProps {
    page: number;
    pageSize: number;
    totalPages: number;
    total: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    onPageChange: (page: number) => void;
    onPageSizeChange: (pageSize: number) => void;
}

export function PaginationControls({
    page,
    pageSize,
    totalPages,
    total,
    hasNextPage,
    hasPreviousPage,
    onPageChange,
    onPageSizeChange,
}: PaginationControlsProps) {
    const startItem = total === 0 ? 0 : (page - 1) * pageSize + 1;
    const endItem = Math.min(page * pageSize, total);

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-4 border-t">
            <div className="flex items-center gap-6">
                <div className="text-sm text-muted-foreground">
                    {total === 0 ? (
                        "No positions"
                    ) : (
                        <>
                            Showing <span className="font-medium">{startItem}</span> to{" "}
                            <span className="font-medium">{endItem}</span> of{" "}
                            <span className="font-medium">{total}</span> positions
                        </>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                        Rows per page:
                    </span>
                    <Select
                        value={pageSize.toString()}
                        onValueChange={(value) => onPageSizeChange(Number(value))}
                    >
                        <SelectTrigger className="w-[70px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="20">20</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                            <SelectItem value="100">100</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="text-sm text-muted-foreground whitespace-nowrap">
                    Page {page} of {totalPages || 1}
                </div>

                <div className="flex items-center gap-1">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => onPageChange(1)}
                        disabled={!hasPreviousPage}
                        title="First page"
                    >
                        <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => onPageChange(page - 1)}
                        disabled={!hasPreviousPage}
                        title="Previous page"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => onPageChange(page + 1)}
                        disabled={!hasNextPage}
                        title="Next page"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => onPageChange(totalPages)}
                        disabled={!hasNextPage}
                        title="Last page"
                    >
                        <ChevronsRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
