"use client";

import * as React from "react";
import {
  LayoutDashboard,
  ShoppingCart,
  TrendingUp,
  Activity,
  Radio,
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
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { UserWithRole } from "@/lib/auth-utils";
import { NavigationGroup } from "@/lib/navigation";

const customerNavigation: NavigationGroup[] = [
  {
    id: "overview",
    title: "OVERVIEW",
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
    title: "TRADING",
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
      {
        id: "customer-signals",
        title: "Signals",
        description: "View your trading signals",
        url: "/customer/signals",
        icon: Radio,
        isActive: true,
      },
    ],
  },
];

export function CustomerSidebar({ user }: { user: UserWithRole }) {
  return (
    <Sidebar 
      collapsible="icon"
      className="border-r border-slate-200 bg-white"
    >
      <SidebarHeader className="border-b border-slate-100 bg-gradient-to-b from-slate-50 to-white">
        <div className="flex items-center gap-2 px-4 py-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 shadow-sm flex-shrink-0">
            <Image
              src="/animated_bytix_logo.png"
              alt="Bytix Logo"
              width={32}
              height={32}
              className="size-8 rounded-lg object-contain"
            />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
            <span className="truncate font-bold text-slate-900">Customer Portal</span>
            <span className="truncate text-xs text-muted-foreground">
              {user.email}
            </span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="bg-white py-4">
        <NavMain groups={customerNavigation} />
      </SidebarContent>
      <SidebarFooter className="border-t border-slate-100 bg-gradient-to-t from-slate-50 to-white">
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

