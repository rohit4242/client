import { getUserWithRole } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import { getAllSignals } from "@/db/actions/customer/get-all-signals";
import { SignalsTable } from "./_components/signals-table";
import { Radio } from "lucide-react";

export default async function CustomerSignalsPage() {
  const user = await getUserWithRole();

  if (!user) {
    redirect("/sign-in");
  }

  // Fetch all customer signals
  const signals = await getAllSignals();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between pb-6 border-b border-slate-200">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent flex items-center gap-2">
            <Radio className="h-8 w-8 text-teal-600" />
            Signals
          </h1>
          <p className="text-slate-600 text-base">
            View and manage all your trading signals
          </p>
        </div>
      </div>

      {/* Signals Table */}
      <SignalsTable signals={signals} />
    </div>
  );
}

