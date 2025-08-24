import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AppSidebar } from "./_components/app-sidebar";
import { MobileNav } from "./_components/mobile-nav";
import { Separator } from "@/components/ui/separator";
import { NavigationBreadcrumb } from "./_components/navigation-breadcrumb";
import { NavigationSearch } from "./_components/navigation-search";
import { NavigationProvider } from "@/contexts/navigation-context";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  return (
    <NavigationProvider>
      <SidebarProvider>
        <AppSidebar />
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
  );
}
