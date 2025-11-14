"use client";

import * as React from "react";
import { ChevronsUpDown, User, CheckCircle } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useSelectedUser } from "@/contexts/selected-user-context";
import { AssignedCustomer } from "@/db/actions/agent/get-assigned-customers";
import { GeneratedAvatar } from "@/components/generated-avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import Image from "next/image";

interface AgentUserSelectorProps {
  customers: AssignedCustomer[];
}

export function AgentUserSelector({ customers }: AgentUserSelectorProps) {
  const { isMobile } = useSidebar();
  const { selectedUser, setSelectedUser } = useSelectedUser();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              {selectedUser ? (
                <>
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    {selectedUser.image ? (
                      <Image
                        src={selectedUser.image || ""}
                        alt={selectedUser.name}
                        className="size-8 rounded-lg"
                        width={32}
                        height={32}
                      />
                    ) : (
                      <GeneratedAvatar
                        seed={selectedUser.name}
                        variant="initials"
                        className="size-8 rounded-lg"
                      />
                    )}
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {selectedUser.name}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {selectedUser.email}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto" />
                </>
              ) : (
                <>
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-muted">
                    <User className="size-4 text-muted-foreground" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      Select Customer
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      Choose a customer to manage
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto" />
                </>
              )}
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Assigned Customers
            </DropdownMenuLabel>
            <ScrollArea className="max-h-[300px]">
              {customers.length === 0 ? (
                <div className="p-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    No customers assigned
                  </p>
                </div>
              ) : (
                customers.map((customer, index) => (
                  <DropdownMenuItem
                    key={customer.id}
                    onClick={() => setSelectedUser({
                      id: customer.id,
                      name: customer.name,
                      email: customer.email,
                      image: customer.image,
                      role: "CUSTOMER",
                      hasPortfolio: customer.hasPortfolio,
                      createdAt: customer.createdAt,
                      portfolioId: customer.portfolioId,
                    })}
                    className="gap-2 p-2"
                  >
                    <div className="flex size-8 items-center justify-center rounded-sm border">
                      {customer.image ? (
                        <Image
                          src={customer.image}
                          alt={customer.name}
                          className="size-8 rounded-sm"
                          width={32}
                          height={32}
                        />
                      ) : (
                        <GeneratedAvatar
                          seed={customer.name}
                          variant="initials"
                          className="size-8 rounded-sm"
                        />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{customer.name}</span>
                        {!customer.hasPortfolio && (
                          <Badge variant="outline" className="text-xs">
                            No Portfolio
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {customer.email}
                      </span>
                    </div>
                    {selectedUser?.id === customer.id && (
                      <CheckCircle className="size-4 text-primary" />
                    )}
                    <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
                  </DropdownMenuItem>
                ))
              )}
            </ScrollArea>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled className="gap-2 p-2 text-muted-foreground">
              <div className="text-xs">
                Showing {customers.length} assigned customer{customers.length !== 1 ? 's' : ''}
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

