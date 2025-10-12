import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { getUserWithRole } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import { CustomerSidebar } from "./_components/customer-sidebar";
import { Separator } from "@/components/ui/separator";
import { NavigationProvider } from "@/contexts/navigation-context";

export default async function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUserWithRole();

  // Redirect to sign-in if not authenticated
  if (!user) {
    redirect("/sign-in");
  }

  // Both CUSTOMER and ADMIN can access customer portal
  // (Admin can view customer stuff, but customers can't view admin stuff)

  return (
    <NavigationProvider>
      <SidebarProvider>
        <CustomerSidebar user={user} />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            <div className="flex items-center w-full gap-2 px-4">
              <div className="flex items-center gap-2 flex-1">
                <SidebarTrigger className="-ml-1" />
                <Separator
                  orientation="vertical"
                  className="mr-2 data-[orientation=vertical]:h-4"
                />
                <h2 className="text-lg font-semibold">Customer Portal</h2>
              </div>
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
  );
}

