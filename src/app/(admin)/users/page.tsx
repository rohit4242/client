import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { isAdmin } from "@/lib/auth-utils";
import { getAllUsers } from "@/db/actions/admin/get-all-users";
import { UsersTable } from "./_components/users-table";
import { Users as UsersIcon } from "lucide-react";

export default async function UsersPage() {
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

  const users = await getAllUsers();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 pb-6 border-b border-slate-200">
        <div className="flex size-14 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 text-white shadow-md">
          <UsersIcon className="size-7" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
            User Management
          </h1>
          <p className="text-slate-600 text-base mt-1">
            Manage user roles and agent assignments
          </p>
        </div>
      </div>

      <UsersTable users={users} />
    </div>
  );
}
