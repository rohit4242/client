"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Search, UserCog, Users as UsersIcon } from "lucide-react";
import { UserRoleBadge } from "./user-role-badge";
import { RoleChangeDialog } from "./role-change-dialog";
import { AssignAgentDialog } from "./assign-agent-dialog";
import { UserWithAgent } from "@/db/actions/admin/get-all-users";
import { GeneratedAvatar } from "@/components/generated-avatar";
import Image from "next/image";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface UsersTableProps {
  users: UserWithAgent[];
}

export function UsersTable({ users }: UsersTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [selectedUserForRole, setSelectedUserForRole] = useState<UserWithAgent | null>(null);
  const [selectedUserForAgent, setSelectedUserForAgent] = useState<UserWithAgent | null>(null);

  // Filter users based on search and role filter
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === "ALL" || user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 md:max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search users by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Roles</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
            <SelectItem value="AGENT">Agent</SelectItem>
            <SelectItem value="CUSTOMER">Customer</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2 rounded-lg border px-4 py-2">
          <span className="text-sm text-muted-foreground">Total Users:</span>
          <span className="font-semibold">{filteredUsers.length}</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg border px-4 py-2">
          <span className="text-sm text-muted-foreground">Admins:</span>
          <span className="font-semibold">
            {users.filter((u) => u.role === "ADMIN").length}
          </span>
        </div>
        <div className="flex items-center gap-2 rounded-lg border px-4 py-2">
          <span className="text-sm text-muted-foreground">Agents:</span>
          <span className="font-semibold">
            {users.filter((u) => u.role === "AGENT").length}
          </span>
        </div>
        <div className="flex items-center gap-2 rounded-lg border px-4 py-2">
          <span className="text-sm text-muted-foreground">Customers:</span>
          <span className="font-semibold">
            {users.filter((u) => u.role === "CUSTOMER").length}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Assigned Agent</TableHead>
              <TableHead>Portfolio</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  <div className="py-8 text-muted-foreground">
                    {searchQuery || roleFilter !== "ALL"
                      ? "No users found matching your filters"
                      : "No users found"}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {user.image ? (
                        <Image
                          src={user.image}
                          alt={user.name}
                          width={32}
                          height={32}
                          className="size-8 rounded-full"
                        />
                      ) : (
                        <GeneratedAvatar
                          seed={user.name}
                          variant="initials"
                          className="size-8 rounded-full"
                        />
                      )}
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <UserRoleBadge role={user.role} />
                      {user.role === "AGENT" && user.customerCount !== undefined && (
                        <Badge variant="outline" className="text-xs">
                          <UsersIcon className="mr-1 size-3" />
                          {user.customerCount}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.role === "CUSTOMER" ? (
                      user.agentName ? (
                        <Badge variant="secondary">{user.agentName}</Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          Not assigned
                        </span>
                      )
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {user.hasPortfolio ? (
                      <Badge variant="outline" className="text-green-600">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">
                        None
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="size-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setSelectedUserForRole(user)}
                        >
                          <UserCog className="mr-2 size-4" />
                          Change Role
                        </DropdownMenuItem>
                        {user.role === "CUSTOMER" && (
                          <DropdownMenuItem
                            onClick={() => setSelectedUserForAgent(user)}
                          >
                            <UsersIcon className="mr-2 size-4" />
                            Assign Agent
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialogs */}
      {selectedUserForRole && (
        <RoleChangeDialog
          open={!!selectedUserForRole}
          onOpenChange={(open) => !open && setSelectedUserForRole(null)}
          user={selectedUserForRole}
        />
      )}

      {selectedUserForAgent && (
        <AssignAgentDialog
          open={!!selectedUserForAgent}
          onOpenChange={(open) => !open && setSelectedUserForAgent(null)}
          customer={selectedUserForAgent}
        />
      )}
    </div>
  );
}

