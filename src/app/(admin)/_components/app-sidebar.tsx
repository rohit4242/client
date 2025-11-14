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
import { UserWithAgent } from "@/db/actions/admin/get-all-users";

export const data = {
  teams: [
    {
      name: "Bytix",
      logo: "/animated_bytix_logo.png",
      plan: "Premium",
    },
  ],
};

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  users: UserWithAgent[];
}

export function AppSidebar({ users, ...props }: AppSidebarProps) {
  return (
    <Sidebar 
      collapsible="icon" 
      {...props}
      className="border-r border-slate-200 bg-white"
    >
      <SidebarHeader className="border-b border-slate-100 bg-gradient-to-b from-slate-50 to-white">
        <TeamSwitcher activeTeam={data.teams} />
        <SidebarSeparator className="mx-0 bg-slate-200" />
        <UserSelector users={users} />
      </SidebarHeader>
      <SidebarContent className="bg-white py-4">
        <NavMain />
      </SidebarContent>
      <SidebarFooter className="border-t border-slate-100 bg-gradient-to-t from-slate-50 to-white">
        <NavUser />
      </SidebarFooter>
      {/* <SidebarRail className="bg-slate-200" /> */}
    </Sidebar>
  );
}
