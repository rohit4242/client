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
          <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-2 border-b border-slate-200 bg-white/80 backdrop-blur-lg supports-[backdrop-filter]:bg-white/60 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 shadow-sm">
            <div className="flex items-center w-full gap-2 px-6">
              <div className="flex items-center gap-3 flex-1">
                <SidebarTrigger className="-ml-1 hidden md:flex hover:bg-teal-50 hover:text-teal-700 rounded-lg transition-colors" />
                <Separator
                  orientation="vertical"
                  className="mr-2 h-5 bg-slate-200"
                />
                <h2 className="text-lg font-semibold text-slate-900">Customer Portal</h2>
              </div>
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-6 pt-6 bg-slate-50">
            <div className="rounded-2xl min-h-[calc(100vh-8rem)] p-8 border border-slate-200 bg-white shadow-sm">
              {children}
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </NavigationProvider>
  );
}

