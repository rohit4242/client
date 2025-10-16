import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getUserWithRole } from "@/lib/auth-utils";

export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  // Get user role and redirect accordingly
  const user = await getUserWithRole();

  if (!user) {
    redirect("/sign-in");
  }

  // Role-based routing
  if (user.role === "ADMIN") {
    redirect("/dashboard");
  } else if (user.role === "AGENT") {
    redirect("/agent/dashboard");
  } else {
    redirect("/customer/dashboard");
  }
}
