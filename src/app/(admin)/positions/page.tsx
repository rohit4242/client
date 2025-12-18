import { Suspense } from "react";
import { PositionsClient } from "./_components/positions-client";
import { PositionsLoadingSkeleton } from "./_components/positions-loading";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Positions & Trading | Bytix Admin",
  description: "Monitor live positions, track P&L, and manage trading activity",
};

export default function PositionsPage() {
  return (
    <Suspense fallback={<PositionsLoadingSkeleton />}>
      <PositionsClient />
    </Suspense>
  );
}
