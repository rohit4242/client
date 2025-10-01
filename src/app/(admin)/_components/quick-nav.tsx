"use client"

import { useMemo } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useNavigationContext } from "@/contexts/navigation-context"
import { cn } from "@/lib/utils"
import { NavigationItem } from "@/lib/navigation"

export function QuickNav() {
  const { navigationConfig, isActiveRoute } = useNavigationContext();

  const quickNavItems = useMemo(() => {
    const overviewItems = navigationConfig[0]?.items || [];
    const tradingItems = navigationConfig[1]?.items || [];
    
    return [...overviewItems, ...tradingItems].filter(item => item.isActive);
  }, [navigationConfig]);

  if (quickNavItems.length === 0) {
    return null;
  }

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Quick Navigation
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-wrap gap-2">
          {quickNavItems.map((item: NavigationItem) => {
            const Icon = item.icon;
            const isActive = isActiveRoute(item.url);

            return (
              <Button
                key={item.id}
                variant={isActive ? "default" : "outline"}
                size="sm"
                asChild
                className={cn(
                  "h-8 px-3",
                  isActive && "bg-primary text-primary-foreground"
                )}
              >
                <Link href={item.url}>
                  {Icon && <Icon className="w-3 h-3 mr-1.5" />}
                  {item.title}
                  {item.badge && (
                    <Badge 
                      variant={item.badgeVariant || "secondary"} 
                      className="ml-1.5 text-xs px-1 py-0"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
} 