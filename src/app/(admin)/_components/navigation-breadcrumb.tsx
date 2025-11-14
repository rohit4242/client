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
    <nav className="flex items-center space-x-1 text-sm">
      <Link
        href="/dashboard"
        className="flex items-center px-2 py-1.5 rounded-lg text-slate-600 hover:text-teal-700 hover:bg-teal-50 transition-all duration-200"
      >
        <Home className="w-4 h-4" />
        <span className="sr-only">Home</span>
      </Link>
      
      {breadcrumbs.map((item, index) => (
        <div key={item.id} className="flex items-center">
          <ChevronRight className="w-4 h-4 mx-0.5 text-slate-400" />
          <Link
            href={item.url}
            className={cn(
              "px-2 py-1.5 rounded-lg transition-all duration-200",
              index === breadcrumbs.length - 1 
                ? "text-teal-700 font-semibold bg-teal-50" 
                : "text-slate-600 hover:text-teal-700 hover:bg-teal-50"
            )}
          >
            {item.title}
          </Link>
        </div>
      ))}
    </nav>
  );
}
