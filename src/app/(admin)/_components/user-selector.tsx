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
import { UserWithAgent } from "@/db/actions/admin/get-all-users";
import { GeneratedAvatar } from "@/components/generated-avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import Image from "next/image";
import { UserRoleBadge } from "../users/_components/user-role-badge";

// Avatar component with error handling
function UserAvatar({ 
  image, 
  name, 
  className 
}: { 
  image: string | null; 
  name: string; 
  className?: string;
}) {
  const [imageError, setImageError] = React.useState(false);

  if (!image || imageError) {
    return (
      <GeneratedAvatar
        seed={name}
        variant="initials"
        className={className}
      />
    );
  }

  return (
    <Image
      src={image}
      alt={name}
      className={className || "size-8 rounded-lg"}
      width={32}
      height={32}
      onError={() => setImageError(true)}
    />
  );
}

interface UserSelectorProps {
  users: UserWithAgent[];
}

export function UserSelector({ users }: UserSelectorProps) {
  const { isMobile } = useSidebar();
  const { selectedUser, setSelectedUser } = useSelectedUser();

  // Group users by role
  const usersByRole = React.useMemo(() => {
    const grouped = {
      ADMIN: [] as UserWithAgent[],
      AGENT: [] as UserWithAgent[],
      CUSTOMER: [] as UserWithAgent[],
    };
    users.forEach((user) => {
      grouped[user.role].push(user);
    });
    return grouped;
  }, [users]);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-teal-50 data-[state=open]:text-teal-900 hover:bg-teal-50 transition-all duration-200"
            >
              {selectedUser ? (
                <>
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg border-2 border-teal-200 bg-teal-50 shadow-sm">
                    <UserAvatar
                      image={selectedUser.image}
                      name={selectedUser.name}
                      className="size-7 rounded-lg"
                    />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold text-slate-900">
                      {selectedUser.name}
                    </span>
                    <span className="truncate text-xs text-slate-600">
                      {selectedUser.email}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4 text-teal-600" />
                </>
              ) : (
                <>
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg border-2 border-slate-200 bg-slate-50">
                    <User className="size-4 text-slate-400" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold text-slate-700">
                      Select User
                    </span>
                    <span className="truncate text-xs text-slate-500">
                      Choose a user to manage
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4 text-slate-400" />
                </>
              )}
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-xl border-slate-200 shadow-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <ScrollArea className="max-h-[400px]">
              {users.length === 0 ? (
                <div className="p-4 text-center">
                  <p className="text-sm text-slate-600">
                    No users found
                  </p>
                </div>
              ) : (
                <>
                  {/* Agents */}
                  {usersByRole.AGENT.length > 0 && (
                    <>
                      <DropdownMenuLabel className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Agents
                      </DropdownMenuLabel>
                      {usersByRole.AGENT.map((user, index) => (
                        <DropdownMenuItem
                          key={user.id}
                          onClick={() => setSelectedUser(user)}
                          className="gap-3 p-3 cursor-pointer hover:bg-teal-50 transition-colors rounded-lg mx-1"
                        >
                          <div className="flex size-9 items-center justify-center rounded-lg border-2 border-teal-200 bg-teal-50">
                            <UserAvatar
                              image={user.image}
                              name={user.name}
                              className="size-8 rounded-lg"
                            />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-900">{user.name}</span>
                              <UserRoleBadge role={user.role} />
                              {user.customerCount !== undefined && user.customerCount > 0 && (
                                <Badge variant="outline" className="text-xs bg-teal-50 text-teal-700 border-teal-200">
                                  {user.customerCount}
                                </Badge>
                              )}
                            </div>
                            <span className="text-xs text-slate-600">
                              {user.email}
                            </span>
                          </div>
                          {selectedUser?.id === user.id && (
                            <CheckCircle className="size-4 text-teal-600" />
                          )}
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator className="my-2 bg-slate-200" />
                    </>
                  )}

                  {/* Customers */}
                  {usersByRole.CUSTOMER.length > 0 && (
                    <>
                      <DropdownMenuLabel className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Customers
                      </DropdownMenuLabel>
                      {usersByRole.CUSTOMER.map((user, index) => (
                        <DropdownMenuItem
                          key={user.id}
                          onClick={() => setSelectedUser(user)}
                          className="gap-3 p-3 cursor-pointer hover:bg-teal-50 transition-colors rounded-lg mx-1"
                        >
                          <div className="flex size-9 items-center justify-center rounded-lg border-2 border-teal-200 bg-teal-50">
                            <UserAvatar
                              image={user.image}
                              name={user.name}
                              className="size-8 rounded-lg"
                            />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-900">{user.name}</span>
                              <UserRoleBadge role={user.role} />
                              {!user.hasPortfolio && (
                                <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                                  No Portfolio
                                </Badge>
                              )}
                            </div>
                            <span className="text-xs text-slate-600">
                              {user.email}
                            </span>
                          </div>
                          {selectedUser?.id === user.id && (
                            <CheckCircle className="size-4 text-teal-600" />
                          )}
                        </DropdownMenuItem>
                      ))}
                    </>
                  )}
                </>
              )}
            </ScrollArea>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
