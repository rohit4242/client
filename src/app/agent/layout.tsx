import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { getUserWithRole } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import { AgentSidebar } from "./_components/agent-sidebar";
import { MobileNav } from "../(admin)/_components/mobile-nav";
import { Separator } from "@/components/ui/separator";
import { NavigationBreadcrumb } from "../(admin)/_components/navigation-breadcrumb";
import { NavigationSearch } from "../(admin)/_components/navigation-search";
import { NavigationProvider } from "@/contexts/navigation-context";
import { SelectedUserProvider } from "@/contexts/selected-user-context";
import { getAssignedCustomers } from "@/db/actions/agent/get-assigned-customers";

export default async function AgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUserWithRole();

  // Redirect to sign-in if not authenticated
  if (!user) {
    redirect("/sign-in");
  }

  // Only AGENT can access agent portal
  if (user.role !== "AGENT") {
    // Redirect based on their actual role
    if (user.role === "ADMIN") {
      redirect("/dashboard");
    } else {
      redirect("/customer/dashboard");
    }
  }

  // Fetch assigned customers for the agent
  const customers = await getAssignedCustomers();

  return (
    <SelectedUserProvider>
      <NavigationProvider>
        <SidebarProvider>
          <AgentSidebar customers={customers} />
          <SidebarInset>
            <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
              <div className="flex items-center w-full gap-2 px-4">
                <div className="flex items-center gap-2 flex-1">
                  <MobileNav />
                  <SidebarTrigger className="-ml-1 hidden md:flex" />
                  <Separator
                    orientation="vertical"
                    className="mr-2 data-[orientation=vertical]:h-4"
                  />
                  <NavigationBreadcrumb />
                </div>
                <div className="flex items-center justify-center flex-1">
                  <NavigationSearch />
                </div>
                <div className="flex-1"></div>
              </div>
            </header>
            <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
              <div className="bg-muted/50 rounded-xl min-h-[calc(100vh-8rem)] p-6">
                {children}
              </div>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </NavigationProvider>
    </SelectedUserProvider>
  );
}

