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
  const [imageError, setImageError] = useState(false);

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
      className={className || "size-8 rounded-full"}
      width={32}
      height={32}
      onError={() => setImageError(true)}
    />
  );
}

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
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-slate-50 p-4 rounded-xl border border-slate-200">
        <div className="relative flex-1 md:max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
          <Input
            placeholder="Search users by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 border-slate-200 bg-white focus:border-teal-500 focus:ring-teal-500 rounded-lg shadow-sm"
          />
        </div>

        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full md:w-[180px] border-slate-200 bg-white focus:border-teal-500 focus:ring-teal-500 rounded-lg shadow-sm font-medium">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent className="rounded-lg">
            <SelectItem value="ALL">All Roles</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
            <SelectItem value="AGENT">Agent</SelectItem>
            <SelectItem value="CUSTOMER">Customer</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-3 shadow-sm">
          <span className="text-sm font-medium text-slate-600">Total Users:</span>
          <span className="text-lg font-bold text-slate-900">{filteredUsers.length}</span>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50 px-5 py-3 shadow-sm">
          <span className="text-sm font-medium text-purple-700">Admins:</span>
          <span className="text-lg font-bold text-purple-900">
            {users.filter((u) => u.role === "ADMIN").length}
          </span>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 px-5 py-3 shadow-sm">
          <span className="text-sm font-medium text-blue-700">Agents:</span>
          <span className="text-lg font-bold text-blue-900">
            {users.filter((u) => u.role === "AGENT").length}
          </span>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-teal-200 bg-gradient-to-br from-teal-50 to-emerald-50 px-5 py-3 shadow-sm">
          <span className="text-sm font-medium text-teal-700">Customers:</span>
          <span className="text-lg font-bold text-teal-900">
            {users.filter((u) => u.role === "CUSTOMER").length}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 overflow-hidden shadow-md bg-white">
        <Table>
          <TableHeader className="bg-gradient-to-r from-slate-50 to-slate-100">
            <TableRow className="border-b-2 border-slate-200 hover:bg-slate-100">
              <TableHead className="font-bold text-slate-900 py-4">User</TableHead>
              <TableHead className="font-bold text-slate-900 py-4">Role</TableHead>
              <TableHead className="font-bold text-slate-900 py-4">Assigned Agent</TableHead>
              <TableHead className="font-bold text-slate-900 py-4">Portfolio</TableHead>
              <TableHead className="font-bold text-slate-900 py-4">Created</TableHead>
              <TableHead className="text-right font-bold text-slate-900 py-4">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  <div className="py-12 text-slate-500 text-base font-medium">
                    {searchQuery || roleFilter !== "ALL"
                      ? "No users found matching your filters"
                      : "No users found"}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id} className="border-b border-slate-100 hover:bg-slate-50 transition-all duration-200">
                  <TableCell className="py-4">
                    <div className="flex items-center gap-3">
                      <UserAvatar
                        image={user.image}
                        name={user.name}
                        className="size-10 rounded-full ring-2 ring-slate-100"
                      />
                      <div>
                        <div className="font-semibold text-slate-900">{user.name}</div>
                        <div className="text-sm text-slate-600">
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
                  <TableCell className="py-4">
                    {user.role === "CUSTOMER" ? (
                      user.agentName ? (
                        <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 shadow-sm">{user.agentName}</Badge>
                      ) : (
                        <span className="text-sm text-slate-500 font-medium">
                          Not assigned
                        </span>
                      )
                    ) : (
                      <span className="text-sm text-slate-500">-</span>
                    )}
                  </TableCell>
                  <TableCell className="py-4">
                    {user.hasPortfolio ? (
                      <Badge variant="outline" className="border-green-300 bg-green-50 text-green-700 shadow-sm font-medium">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-slate-300 bg-slate-50 text-slate-600 shadow-sm">
                        None
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="py-4">
                    <span className="text-sm text-slate-600 font-medium">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </TableCell>
                  <TableCell className="text-right py-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="hover:bg-teal-50 hover:text-teal-700 rounded-lg transition-colors">
                          <MoreHorizontal className="size-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-lg shadow-lg">
                        <DropdownMenuLabel className="text-slate-900 font-bold">Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-slate-200" />
                        <DropdownMenuItem
                          onClick={() => setSelectedUserForRole(user)}
                          className="focus:bg-teal-50 focus:text-teal-900 cursor-pointer rounded-md font-medium"
                        >
                          <UserCog className="mr-2 size-4" />
                          Change Role
                        </DropdownMenuItem>
                        {user.role === "CUSTOMER" && (
                          <DropdownMenuItem
                            onClick={() => setSelectedUserForAgent(user)}
                            className="focus:bg-blue-50 focus:text-blue-900 cursor-pointer rounded-md font-medium"
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

