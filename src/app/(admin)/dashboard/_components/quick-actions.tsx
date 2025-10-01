"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, Activity, Users, Target } from "lucide-react";
import Link from "next/link";

const quickActions = [
  {
    href: "/manual-trading",
    icon: BarChart3,
    label: "Manual Trading",
    variant: "outline" as const,
  },
  {
    href: "/positions",
    icon: Activity,
    label: "View Positions",
    variant: "outline" as const,
  },
  {
    href: "/my-exchanges",
    icon: Users,
    label: "Exchanges",
    variant: "outline" as const,
  },
  {
    href: "/signal-bot",
    icon: Target,
    label: "Signal Bot",
    variant: "outline" as const,
  },
] as const;

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Manage your trading activities</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Button key={action.href} variant={action.variant} asChild>
                <Link href={action.href}>
                  <Icon className="w-4 h-4 mr-2" />
                  {action.label}
                </Link>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}