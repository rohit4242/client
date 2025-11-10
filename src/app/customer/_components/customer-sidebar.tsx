"use client";

import * as React from "react";
import {
  LayoutDashboard,
  ShoppingCart,
  TrendingUp,
  Activity,
} from "lucide-react";
import Image from "next/image";

import { NavMain } from "@/app/(admin)/_components/nav-main";
import { NavUser } from "@/app/(admin)/_components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { UserWithRole } from "@/lib/auth-utils";
import { NavigationGroup } from "@/lib/navigation";

const customerNavigation: NavigationGroup[] = [
  {
    id: "overview",
    title: "Overview",
    items: [
      {
        id: "customer-dashboard",
        title: "Dashboard",
        description: "View your account overview",
        url: "/customer/dashboard",
        icon: LayoutDashboard,
        isActive: true,
      },
      {
        id: "customer-orders",
        title: "Orders",
        description: "View your order history",
        url: "/customer/orders",
        icon: ShoppingCart,
        isActive: true,
      },
    ],
  },
  {
    id: "trading",
    title: "Trading",
    items: [
      {
        id: "customer-positions",
        title: "Positions",
        description: "View your trading positions",
        url: "/customer/positions",
        icon: Activity,
        isActive: true,
      },
      {
        id: "customer-performance",
        title: "Performance",
        description: "Track your performance",
        url: "/customer/performance",
        icon: TrendingUp,
        isActive: true,
      },
    ],
  },
];

export function CustomerSidebar({ user }: { user: UserWithRole }) {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-2">
          <div className="flex aspect-square size-8 items-center justify-center">
            <Image
              src="/animated_bytix_logo.png"
              alt="Bytix Logo"
              width={32}
              height={32}
              className="size-8 rounded-lg object-contain"
            />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">Customer Portal</span>
            <span className="truncate text-xs text-muted-foreground">
              {user.email}
            </span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain groups={customerNavigation} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

