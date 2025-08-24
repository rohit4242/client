"use client"

import { ChevronRight, ExternalLink } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

import {
  Collapsible,
} from "@/components/ui/collapsible"
import { Badge } from "@/components/ui/badge"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { NavigationGroup, NavigationItem } from "@/lib/navigation"
import { useNavigationContext } from "@/contexts/navigation-context"

interface NavMainProps {
  groups?: NavigationGroup[];
}

export function NavMain({ groups }: NavMainProps) {
  const { navigationConfig } = useNavigationContext();
  const navigationGroups = groups || navigationConfig;

  const { isActiveRoute } = useNavigationContext();

  const renderNavigationItem = (item: NavigationItem) => {
    const isActive = isActiveRoute(item.url);
    const Icon = item.icon;

    return (
      <SidebarMenuItem key={item.id}>
        <SidebarMenuButton 
          tooltip={item.description || item.title} 
          asChild
          className={cn(
            "w-full transition-colors",
            isActive && "bg-accent text-accent-foreground",
            item.disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          {item.external ? (
            <a 
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              {Icon && <Icon className="w-4 h-4" />}
              <span className="flex-1 text-sm">{item.title}</span>
              {item.badge && (
                <Badge 
                  variant={item.badgeVariant || "secondary"} 
                  className="text-xs px-1.5 py-0.5"
                >
                  {item.badge}
                </Badge>
              )}
              <ExternalLink className="w-3 h-3 opacity-60" />
            </a>
          ) : (
            <Link 
              href={item.disabled ? "#" : item.url}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-md transition-colors",
                !item.disabled && "hover:bg-accent hover:text-accent-foreground",
                isActive && "bg-accent text-accent-foreground"
              )}
            >
              {Icon && <Icon className="w-4 h-4" />}
              <span className="flex-1 text-sm">{item.title}</span>
              {item.badge && (
                <Badge 
                  variant={item.badgeVariant || "secondary"} 
                  className="text-xs px-1.5 py-0.5"
                >
                  {item.badge}
                </Badge>
              )}
              {item.children && item.children.length > 0 && (
                <ChevronRight className="w-3 h-3 opacity-60 transition-transform group-data-[state=open]:rotate-90" />
              )}
            </Link>
          )}
        </SidebarMenuButton>
        
        {/* Render sub-items if they exist */}
        {item.children && item.children.length > 0 && (
          <Collapsible asChild>
            <div className="ml-4 mt-1">
              {item.children.map((child) => (
                <SidebarMenuItem key={child.id}>
                  <SidebarMenuButton 
                    tooltip={child.description || child.title} 
                    asChild
                    className={cn(
                      "w-full transition-colors",
                      isActiveRoute(child.url) && "bg-accent text-accent-foreground",
                      child.disabled && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <Link 
                      href={child.disabled ? "#" : child.url}
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors",
                        !child.disabled && "hover:bg-accent hover:text-accent-foreground",
                        isActiveRoute(child.url) && "bg-accent text-accent-foreground"
                      )}
                    >
                      {child.icon && <child.icon className="w-3 h-3" />}
                      <span className="flex-1">{child.title}</span>
                      {child.badge && (
                        <Badge 
                          variant={child.badgeVariant || "secondary"} 
                          className="text-xs px-1 py-0"
                        >
                          {child.badge}
                        </Badge>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </div>
          </Collapsible>
        )}
      </SidebarMenuItem>
    );
  };

  return (
    <>
      {navigationGroups.map((group: NavigationGroup) => (
        <SidebarGroup key={group.id}>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2">
            {group.title}
          </SidebarGroupLabel>
          <SidebarMenu>
            {group.items.map((item: NavigationItem) => renderNavigationItem(item))}
          </SidebarMenu>
        </SidebarGroup>
      ))}
    </>
  );
}
