import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { isAdmin } from "@/lib/auth-utils";
import { getAllSignals } from "@/db/actions/admin/get-all-signals";
import { SignalsTable } from "./_components/signals-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Radio } from "lucide-react";

export default async function SignalsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  const admin = await isAdmin();

  if (!admin) {
    redirect("/dashboard");
  }

  const signals = await getAllSignals();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex size-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Radio className="size-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Signal Management</h1>
          <p className="text-muted-foreground">
            View, edit, and manage all trading signals from customer bots
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Trading Signals</CardTitle>
          <CardDescription>
            Manage signal visibility, edit signal details, and control which signals customers can see
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SignalsTable signals={signals} />
        </CardContent>
      </Card>
    </div>
  );
}

