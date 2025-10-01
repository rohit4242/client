import {
  Home,
  Activity,
  TrendingUp,
  Bot,
  Wallet,
  LucideIcon,
} from "lucide-react";

export interface NavigationItem {
  id: string;
  title: string;
  description?: string;
  url: string;
  icon?: LucideIcon;
  isActive?: boolean;
  badge?: string;
  badgeVariant?: "default" | "secondary" | "destructive" | "outline";
  disabled?: boolean;
  external?: boolean;
  children?: NavigationItem[];
}

export interface NavigationGroup {
  id: string;
  title: string;
  items: NavigationItem[];
}

export const navigationConfig: NavigationGroup[] = [
  {
    id: "overview",
    title: "Overview",
    items: [
      {
        id: "dashboard",
        title: "Dashboard",
        description: "View your trading overview and statistics",
        url: "/dashboard",
        icon: Home,
        isActive: true,
      },
      {
        id: "positions",
        title: "Positions",
        description: "Manage your open and closed positions",
        url: "/positions",
        icon: Activity,
        isActive: true,
      },
    ],
  },
  {
    id: "trading",
    title: "Trading",
    items: [
      {
        id: "manual-trading",
        title: "Manual Trading",
        description: "Execute trades manually with advanced tools",
        url: "/manual-trading",
        icon: TrendingUp,
        isActive: true,
      },
      {
        id: "signal-bot",
        title: "Signal Bot",
        description: "Automated trading with signal-based strategies",
        url: "/signal-bot",
        icon: Bot,
        isActive: true,
        badgeVariant: "secondary",
      },
    ],
  },
  {
    id: "management",
    title: "Management",
    items: [
      {
        id: "exchanges",
        title: "Exchanges",
        description: "Connect and manage your exchange accounts",
        url: "/exchanges",
        icon: Wallet,
        isActive: true,
      },
    ],
  },
];

// Helper function to get all navigation items flattened
export const getAllNavigationItems = (): NavigationItem[] => {
  return navigationConfig.flatMap(group => group.items);
};

// Helper function to find navigation item by ID
export const findNavigationItem = (id: string): NavigationItem | undefined => {
  return getAllNavigationItems().find(item => item.id === id);
};

// Helper function to get active navigation items
export const getActiveNavigationItems = (): NavigationItem[] => {
  return getAllNavigationItems().filter(item => item.isActive);
}; 