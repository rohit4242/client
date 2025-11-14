import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { getUserWithRole } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import { AppSidebar } from "./_components/app-sidebar";
import { MobileNav } from "./_components/mobile-nav";
import { Separator } from "@/components/ui/separator";
import { NavigationBreadcrumb } from "./_components/navigation-breadcrumb";
import { NavigationSearch } from "./_components/navigation-search";
import { NavigationProvider } from "@/contexts/navigation-context";
import { SelectedUserProvider } from "@/contexts/selected-user-context";
import { getAllUsers } from "@/db/actions/admin/get-all-users";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUserWithRole();

  // Redirect to sign-in if not authenticated
  if (!user) {
    redirect("/sign-in");
  }

  // Only ADMIN can access admin portal
  if (user.role !== "ADMIN") {
    redirect("/customer/dashboard");
  }

  // Fetch all users for the admin
  const allUsers = await getAllUsers();
  
  // Filter out admin users and the current logged-in user
  const selectableUsers = allUsers.filter(
    (u) => u.role !== "ADMIN" && u.id !== user.id
  );

  return (
    <SelectedUserProvider>
      <NavigationProvider>
        <SidebarProvider>
          <AppSidebar users={selectableUsers} />
          <SidebarInset>
            <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-2 border-b border-slate-200 bg-white/80 backdrop-blur-lg supports-[backdrop-filter]:bg-white/60 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 shadow-sm">
              <div className="flex items-center w-full gap-2 px-6">
                <div className="flex items-center gap-3 flex-1">
                  <MobileNav />
                  <SidebarTrigger className="-ml-1 hidden md:flex hover:bg-teal-50 hover:text-teal-700 rounded-lg transition-colors" />
                  <Separator
                    orientation="vertical"
                    className="mr-2 h-5 bg-slate-200"
                  />
                  <NavigationBreadcrumb />
                </div>
                <div className="flex items-center justify-center flex-1">
                  <NavigationSearch />
                </div>
                <div className="flex-1"></div>
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
    </SelectedUserProvider>
  );
}
