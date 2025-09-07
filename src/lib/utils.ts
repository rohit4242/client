import { clsx, type ClassValue } from "clsx"
import { toast } from "sonner";
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const copyApiKey = (apiKey: string) => {
  navigator.clipboard.writeText(apiKey);
  toast.success("API Key copied to clipboard");
};

export const formatCurrency = (value: number | null) => {
  if (value === null) return "Not synced";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
};

export const formatDate = (date: Date) => {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};


export const extractBaseAsset = (symbol: string): string => {
  // Handle common USDT pairs
  if (symbol.endsWith('USDT')) {
    return symbol.replace('USDT', '');
  }
  // Handle BUSD pairs
  if (symbol.endsWith('BUSD')) {
    return symbol.replace('BUSD', '');
  }
  // Handle BTC pairs
  if (symbol.endsWith('BTC')) {
    return symbol.replace('BTC', '');
  }
  // Handle ETH pairs
  if (symbol.endsWith('ETH')) {
    return symbol.replace('ETH', '');
  }
  // Handle BNB pairs
  if (symbol.endsWith('BNB')) {
    return symbol.replace('BNB', '');
  }
  // Default: return the symbol as is if no known quote asset is found
  return symbol;
};

export const extractQuoteAsset = (symbol: string): string => {
  // Handle common USDT pairs
  if (symbol.endsWith('USDT')) {
    return 'USDT';
  }
  // Handle BUSD pairs
  if (symbol.endsWith('BUSD')) {
    return 'BUSD';
  }
  // Handle BTC pairs
  if (symbol.endsWith('BTC')) {
    return 'BTC';
  }
  // Handle ETH pairs
  if (symbol.endsWith('ETH')) {
    return 'ETH';
  }
  // Handle BNB pairs
  if (symbol.endsWith('BNB')) {
    return 'BNB';
  }
  // Default: return USDT as the most common quote asset
  return 'USDT';
};
