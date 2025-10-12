import { getUserWithRole } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import { getRecentPositions } from "@/db/actions/customer/get-recent-positions";
import { PositionsTable } from "./_components/positions-table";

export default async function CustomerPositionsPage() {
  const user = await getUserWithRole();

  if (!user) {
    redirect("/sign-in");
  }

  const positions = await getRecentPositions(50);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Your Positions</h1>
        <p className="text-muted-foreground">
          View all your trading positions and their performance.
        </p>
      </div>

      <PositionsTable positions={positions} />
    </div>
  );
}

