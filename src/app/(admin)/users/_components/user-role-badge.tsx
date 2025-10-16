"use client";

import { Badge } from "@/components/ui/badge";
import { Shield, Users, User } from "lucide-react";

interface UserRoleBadgeProps {
  role: "ADMIN" | "AGENT" | "CUSTOMER";
}

export function UserRoleBadge({ role }: UserRoleBadgeProps) {
  const roleConfig = {
    ADMIN: {
      label: "Admin",
      variant: "default" as const,
      icon: Shield,
      className: "bg-red-500 hover:bg-red-600 text-white",
    },
    AGENT: {
      label: "Agent",
      variant: "secondary" as const,
      icon: Users,
      className: "bg-blue-500 hover:bg-blue-600 text-white",
    },
    CUSTOMER: {
      label: "Customer",
      variant: "outline" as const,
      icon: User,
      className: "",
    },
  };

  const config = roleConfig[role];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={config.className}>
      <Icon className="mr-1 size-3" />
      {config.label}
    </Badge>
  );
}

