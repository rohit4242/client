"use client"

import { useState } from "react"
import { ChevronRight, ExternalLink } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
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
  
  // Initialize open items - automatically open items that have active children
  const getInitialOpenItems = () => {
    const open = new Set<string>();
    const checkItem = (item: NavigationItem) => {
      if (item.children && item.children.length > 0) {
        const hasActiveChild = item.children.some((child) => isActiveRoute(child.url));
        if (hasActiveChild) {
          open.add(item.id);
        }
        item.children.forEach(checkItem);
      }
    };
    navigationGroups.forEach((group) => {
      group.items.forEach(checkItem);
    });
    return open;
  };

  const [openItems, setOpenItems] = useState<Set<string>>(getInitialOpenItems());

  const toggleItem = (itemId: string) => {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const renderNavigationItem = (item: NavigationItem) => {
    const isActive = isActiveRoute(item.url);
    const Icon = item.icon;
    const hasChildren = item.children && item.children.length > 0;
    const isOpen = openItems.has(item.id);
    const hasActiveChild = hasChildren && item.children?.some((child) => isActiveRoute(child.url));

    // If item has children, wrap in Collapsible, otherwise render as regular menu item
    if (hasChildren) {
      return (
        <Collapsible
          key={item.id}
          open={isOpen}
          onOpenChange={() => toggleItem(item.id)}
          asChild
        >
          <SidebarMenuItem>
            <CollapsibleTrigger asChild>
              <SidebarMenuButton
                tooltip={item.description || item.title}
                className={cn(
                  "w-full transition-all duration-200 ease-in-out",
                  "hover:bg-teal-50 hover:text-teal-700",
                  isActive && "bg-teal-600 text-white hover:bg-teal-700 hover:text-white shadow-sm",
                  // Light background when collapsible is open (expanded) - similar to hover
                  isOpen && !isActive && "bg-teal-50 text-teal-700",
                  // Light background when it has an active child
                  hasActiveChild && !isActive && !isOpen && "bg-teal-50/70 text-teal-700",
                  item.disabled && "opacity-50 cursor-not-allowed"
                )}
              >
                <div
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 w-full cursor-pointer",
                    !item.disabled && "hover:scale-[1.02]"
                  )}
                >
                  {Icon && <Icon className="w-4 h-4 flex-shrink-0" />}
                  <span className="flex-1 text-sm font-medium">{item.title}</span>
                  {item.badge && (
                    <Badge
                      variant={item.badgeVariant || "secondary"}
                      className={cn(
                        "text-xs px-2 py-0.5 font-medium",
                        isActive ? "bg-white/20 text-white border-white/30" : "bg-teal-100 text-teal-700 border-teal-200"
                      )}
                    >
                      {item.badge}
                    </Badge>
                  )}
                  <ChevronRight className={cn(
                    "w-3 h-3 opacity-60 transition-transform duration-200",
                    isOpen && "rotate-90"
                  )} />
                </div>
              </SidebarMenuButton>
            </CollapsibleTrigger>

            {/* Render sub-items if they exist */}
            {item.children && (
              <CollapsibleContent className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-top-1 data-[state=open]:slide-in-from-top-1">
                <div className="ml-4 mt-1 space-y-1 pb-1">
                  {item.children.map((child) => (
                    <SidebarMenuItem key={child.id}>
                      <SidebarMenuButton
                        tooltip={child.description || child.title}
                        asChild
                        className={cn(
                          "w-full transition-all duration-200",
                          "hover:bg-teal-50 hover:text-teal-700",
                          isActiveRoute(child.url) && "bg-teal-600 text-white hover:bg-teal-700 hover:text-white",
                          child.disabled && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        <Link
                          href={child.disabled ? "#" : child.url}
                          className={cn(
                            "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200",
                            !child.disabled && "hover:scale-[1.02]"
                          )}
                        >
                          {child.icon && <child.icon className="w-3.5 h-3.5 flex-shrink-0" />}
                          <span className="flex-1 font-medium">{child.title}</span>
                          {child.badge && (
                            <Badge
                              variant={child.badgeVariant || "secondary"}
                              className={cn(
                                "text-xs px-1.5 py-0",
                                isActiveRoute(child.url) ? "bg-white/20 text-white" : "bg-teal-100 text-teal-700"
                              )}
                            >
                              {child.badge}
                            </Badge>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </div>
              </CollapsibleContent>
            )}
          </SidebarMenuItem>
        </Collapsible>
      );
    }

    // Regular menu item without children
    return (
      <SidebarMenuItem key={item.id}>
        <SidebarMenuButton
          tooltip={item.description || item.title}
          asChild
          className={cn(
            "w-full transition-all duration-200 ease-in-out",
            "hover:bg-teal-50 hover:text-teal-700",
            isActive && "bg-teal-600 text-white hover:bg-teal-700 hover:text-white shadow-sm",
            item.disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          {item.external ? (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                "hover:scale-[1.02]"
              )}
            >
              {Icon && <Icon className="w-4 h-4 flex-shrink-0" />}
              <span className="flex-1 text-sm font-medium">{item.title}</span>
              {item.badge && (
                <Badge
                  variant={item.badgeVariant || "secondary"}
                  className={cn(
                    "text-xs px-2 py-0.5 font-medium",
                    isActive ? "bg-white/20 text-white border-white/30" : "bg-teal-100 text-teal-700 border-teal-200"
                  )}
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
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                !item.disabled && "hover:scale-[1.02]"
              )}
            >
              {Icon && <Icon className="w-4 h-4 flex-shrink-0" />}
              <span className="flex-1 text-sm font-medium">{item.title}</span>
              {item.badge && (
                <Badge
                  variant={item.badgeVariant || "secondary"}
                  className={cn(
                    "text-xs px-2 py-0.5 font-medium",
                    isActive ? "bg-white/20 text-white border-white/30" : "bg-teal-100 text-teal-700 border-teal-200"
                  )}
                >
                  {item.badge}
                </Badge>
              )}
            </Link>
          )}
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <>
      {navigationGroups.map((group: NavigationGroup) => (
        <SidebarGroup key={group.id} className="mb-4">
          <SidebarGroupLabel className="text-xs font-bold text-slate-500 uppercase tracking-wider py-2 mb-1">
            {group.title}
          </SidebarGroupLabel>
          <SidebarMenu className="space-y-1">
            {group.items.map((item: NavigationItem) => renderNavigationItem(item))}
          </SidebarMenu>
        </SidebarGroup>
      ))}
    </>
  );
}
