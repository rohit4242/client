"use client"

import React, { createContext, useContext, useMemo, useCallback } from "react";
import { usePathname } from "next/navigation";
import { 
  navigationConfig, 
  NavigationItem,
  getAllNavigationItems,
  findNavigationItem 
} from "@/lib/navigation";

interface NavigationContextType {
  currentRoute: NavigationItem | undefined;
  breadcrumbs: NavigationItem[];
  isActiveRoute: (url: string) => boolean;
  pathname: string;
  navigationConfig: typeof navigationConfig;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const currentRoute = useMemo(() => {
    return findNavigationItem(
      getAllNavigationItems().find(item => 
        pathname.startsWith(item.url)
      )?.id || ""
    );
  }, [pathname]);

  const breadcrumbs = useMemo(() => {
    const items: NavigationItem[] = [];
    
    // Find the navigation item for the current path
    const currentItem = getAllNavigationItems().find(item => 
      pathname.startsWith(item.url)
    );

    if (currentItem) {
      items.push(currentItem);
    }

    return items;
  }, [pathname]);

  const isActiveRoute = useCallback((url: string) => {
    if (url === "/") return pathname === "/";
    return pathname.startsWith(url);
  }, [pathname]);

  const value = useMemo(() => ({
    currentRoute,
    breadcrumbs,
    isActiveRoute,
    pathname,
    navigationConfig,
  }), [currentRoute, breadcrumbs, isActiveRoute, pathname]);

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigationContext() {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error("useNavigationContext must be used within a NavigationProvider");
  }
  return context;
} 