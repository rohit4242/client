import {
  Home,
  Activity,
  TrendingUp,
  Bot,
  Wallet,
  LineChart,
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

// Agent navigation - similar to admin but without user management
export const agentNavigationConfig: NavigationGroup[] = [
  {
    id: "overview",
    title: "Overview",
    items: [
      {
        id: "dashboard",
        title: "Dashboard",
        description: "View customer trading overview and statistics",
        url: "/agent/dashboard",
        icon: Home,
        isActive: true,
      },
      {
        id: "positions",
        title: "Positions",
        description: "Manage customer positions",
        url: "/agent/positions",
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
        description: "Execute trades for customers",
        url: "/agent/manual-trading",
        icon: TrendingUp,
        isActive: true,
      },
      {
        id: "signal-bot",
        title: "Signal Bot",
        description: "View and manage customer bots",
        url: "/agent/signal-bot",
        icon: Bot,
        isActive: true,
        badgeVariant: "secondary",
      },
      {
        id: "live-prices",
        title: "Live Prices",
        description: "Real-time cryptocurrency prices via WebSocket",
        url: "/agent/live-prices",
        icon: LineChart,
        isActive: true,
        badge: "New",
        badgeVariant: "default",
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
        description: "View customer exchange accounts",
        url: "/agent/exchanges",
        icon: Wallet,
        isActive: true,
      },
    ],
  },
];

// Helper function to get all navigation items flattened
export const getAllNavigationItems = (): NavigationItem[] => {
  return agentNavigationConfig.flatMap(group => group.items);
};

// Helper function to find navigation item by ID
export const findNavigationItem = (id: string): NavigationItem | undefined => {
  return getAllNavigationItems().find(item => item.id === id);
};

// Helper function to get active navigation items
export const getActiveNavigationItems = (): NavigationItem[] => {
  return getAllNavigationItems().filter(item => item.isActive);
};

