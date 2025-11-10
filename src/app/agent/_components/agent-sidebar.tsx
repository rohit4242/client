"use client";

import * as React from "react";

import { NavMain } from "../../(admin)/_components/nav-main";
import { NavUser } from "../../(admin)/_components/nav-user";
import { TeamSwitcher } from "../../(admin)/_components/team-switcher";
import { AgentUserSelector } from "./agent-user-selector";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { AssignedCustomer } from "@/db/actions/agent/get-assigned-customers";

export const data = {
  teams: [
    {
      name: "Bytix",
      logo: "/animated_bytix_logo.png",
      plan: "Agent",
    },
  ],
};

interface AgentSidebarProps extends React.ComponentProps<typeof Sidebar> {
  customers: AssignedCustomer[];
}

export function AgentSidebar({ customers, ...props }: AgentSidebarProps) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher activeTeam={data.teams} />
        <SidebarSeparator className="mx-0" />
        <AgentUserSelector customers={customers} />
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

