"use client";

import * as React from "react";

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Image from "next/image";

export function TeamSwitcher({
  activeTeam,
}: {
  activeTeam: {
    name: string;
    logo: string;
    plan: string;
  }[];
}) {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          className="data-[state=open]:bg-teal-50 data-[state=open]:text-teal-900 hover:bg-teal-50 transition-all duration-200"
        >
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 p-1 shadow-sm">
            <Image
              src={activeTeam[0].logo}
              alt={activeTeam[0].name}
              width={32}
              height={32}
              className="size-7 rounded-md object-contain"
            />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-bold text-slate-900">{activeTeam[0].name}</span>
            <span className="truncate text-xs font-medium text-teal-600">{activeTeam[0].plan}</span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
