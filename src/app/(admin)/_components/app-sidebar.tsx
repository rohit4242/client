"use client";

import * as React from "react";

import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";
import { TeamSwitcher } from "./team-switcher";
import { UserSelector } from "./user-selector";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Customer } from "@/db/actions/admin/get-customers";

export const data = {
  teams: [
    {
      name: "Bytik",
      logo: "/logo.svg",
      plan: "Premium",
    },
  ],
};

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  customers: Customer[];
}

export function AppSidebar({ customers, ...props }: AppSidebarProps) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher activeTeam={data.teams} />
        <SidebarSeparator className="mx-0" />
        <UserSelector customers={customers} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
