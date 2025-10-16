"use client"

import React, { createContext, useContext, useMemo, useCallback } from "react";
import { usePathname } from "next/navigation";
import { 
  navigationConfig as adminNavigationConfig, 
  NavigationItem,
  NavigationGroup
} from "@/lib/navigation";
import { agentNavigationConfig } from "@/lib/agent-navigation";

interface NavigationContextType {
  currentRoute: NavigationItem | undefined;
  breadcrumbs: NavigationItem[];
  isActiveRoute: (url: string) => boolean;
  pathname: string;
  navigationConfig: NavigationGroup[];
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

interface NavigationProviderProps {
  children: React.ReactNode;
}

export function NavigationProvider({ children }: NavigationProviderProps) {
  const pathname = usePathname();

  // Automatically select navigation config based on current path
  const navigationConfig = useMemo(() => {
    if (pathname.startsWith('/agent')) {
      return agentNavigationConfig;
    }
    return adminNavigationConfig;
  }, [pathname]);

  // Helper functions that work with any navigation config
  const getAllNavigationItems = useCallback((): NavigationItem[] => {
    return navigationConfig.flatMap(group => group.items);
  }, [navigationConfig]);

  const findNavigationItem = useCallback((id: string): NavigationItem | undefined => {
    return getAllNavigationItems().find(item => item.id === id);
  }, [getAllNavigationItems]);

  const currentRoute = useMemo(() => {
    return findNavigationItem(
      getAllNavigationItems().find(item => 
        pathname.startsWith(item.url)
      )?.id || ""
    );
  }, [pathname, getAllNavigationItems, findNavigationItem]);

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
  }, [pathname, getAllNavigationItems]);

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
  }), [currentRoute, breadcrumbs, isActiveRoute, pathname, navigationConfig]);

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