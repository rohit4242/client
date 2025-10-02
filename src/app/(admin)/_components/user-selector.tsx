"use client";

import * as React from "react";
import { ChevronsUpDown, Plus, User, CheckCircle } from "lucide-react";

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
import { Customer } from "@/db/actions/admin/get-customers";
import { GeneratedAvatar } from "@/components/generated-avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface UserSelectorProps {
  customers: Customer[];
}

export function UserSelector({ customers }: UserSelectorProps) {
  const { isMobile } = useSidebar();
  const { selectedUser, setSelectedUser } = useSelectedUser();
  console.log(selectedUser?.image);

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
                      <img
                        src={selectedUser.image || ""}
                        alt={selectedUser.name}
                        className="size-8 rounded-lg"
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
              Customers
            </DropdownMenuLabel>
            <ScrollArea className="max-h-[300px]">
              {customers.length === 0 ? (
                <div className="p-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    No customers found
                  </p>
                </div>
              ) : (
                customers.map((customer, index) => (
                  <DropdownMenuItem
                    key={customer.id}
                    onClick={() => setSelectedUser(customer)}
                    className="gap-2 p-2"
                  >
                    <div className="flex size-8 items-center justify-center rounded-sm border">
                      {customer.image ? (
                        <img
                          src={customer.image}
                          alt={customer.name}
                          className="size-8 rounded-sm"
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
            <DropdownMenuItem className="gap-2 p-2">
              <div className="flex size-8 items-center justify-center rounded-md border border-dashed">
                <Plus className="size-4" />
              </div>
              <div className="font-medium text-muted-foreground">
                Add customer
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

