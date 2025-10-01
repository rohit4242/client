"use client"

import { ChevronRight, Home } from "lucide-react"
import Link from "next/link"
import { useNavigationContext } from "@/contexts/navigation-context"
import { cn } from "@/lib/utils"

export function NavigationBreadcrumb() {
  const { breadcrumbs, currentRoute } = useNavigationContext();

  if (!currentRoute) {
    return null;
  }

  return (
    <nav className="flex items-center space-x-1 text-sm text-muted-foreground">
      <Link
        href="/dashboard"
        className="flex items-center hover:text-foreground transition-colors"
      >
        <Home className="w-4 h-4" />
        <span className="sr-only">Home</span>
      </Link>
      
      {breadcrumbs.map((item, index) => (
        <div key={item.id} className="flex items-center">
          <ChevronRight className="w-4 h-4 mx-1" />
          <Link
            href={item.url}
            className={cn(
              "hover:text-foreground transition-colors",
              index === breadcrumbs.length - 1 && "text-foreground font-medium"
            )}
          >
            {item.title}
          </Link>
        </div>
      ))}
    </nav>
  );
} 