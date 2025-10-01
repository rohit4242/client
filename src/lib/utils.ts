import { PositionSide } from "@/types/signal-bot";
import { clsx, type ClassValue } from "clsx";
import { toast } from "sonner";
import { twMerge } from "tailwind-merge";
import { UserRole } from "./auth-utils";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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
  if (symbol.endsWith("USDT")) {
    return symbol.replace("USDT", "");
  }
  // Handle BUSD pairs
  if (symbol.endsWith("BUSD")) {
    return symbol.replace("BUSD", "");
  }
  // Handle BTC pairs
  if (symbol.endsWith("BTC")) {
    return symbol.replace("BTC", "");
  }
  // Handle ETH pairs
  if (symbol.endsWith("ETH")) {
    return symbol.replace("ETH", "");
  }
  // Handle BNB pairs
  if (symbol.endsWith("BNB")) {
    return symbol.replace("BNB", "");
  }
  // Default: return the symbol as is if no known quote asset is found
  return symbol;
};

export const extractQuoteAsset = (symbol: string): string => {
  // Handle common USDT pairs
  if (symbol.endsWith("USDT")) {
    return "USDT";
  }
  // Handle BUSD pairs
  if (symbol.endsWith("BUSD")) {
    return "BUSD";
  }
  // Handle BTC pairs
  if (symbol.endsWith("BTC")) {
    return "BTC";
  }
  // Handle ETH pairs
  if (symbol.endsWith("ETH")) {
    return "ETH";
  }
  // Handle BNB pairs
  if (symbol.endsWith("BNB")) {
    return "BNB";
  }
  // Default: return USDT as the most common quote asset
  return "USDT";
};

/**
 * Calculates position quantity based on available balance and bot settings
 */
export function calculatePositionQuantity(
  side: PositionSide,
  availableBalance: number,
  currentPrice: number,
  positionPercent: number,
  customQuantity?: number
) {
  // Calculate max position value
  const maxPositionValue =
    side === "Long" ? availableBalance : availableBalance * currentPrice;

  // Apply portfolio percentage with safety buffer for fees
  const targetPositionValue = (maxPositionValue * positionPercent) / 100;
  const positionValue = Math.min(targetPositionValue, maxPositionValue * 0.98);

  console.log(
    `Max position value: ${maxPositionValue}, Target: ${targetPositionValue}, Final: ${positionValue}`
  );

  // Calculate raw quantity
  let rawQuantity = customQuantity;

  if (!rawQuantity) {
    if (side === "Long") {
      rawQuantity = positionValue / currentPrice;
    } else {
      rawQuantity = Math.min(availableBalance, positionValue / currentPrice);
    }
  }

  console.log(`Calculated raw quantity: ${rawQuantity}`);

  return rawQuantity;
}

/**
 * Adjusts quantity to meet exchange constraints
 */
export function adjustQuantityToConstraints(
  rawQuantity: number,
  currentPrice: number,
  constraints: { minQty: number; stepSize: number; minNotional: number }
) {
  // Ensure minimum quantity
  let quantity = Math.max(rawQuantity, constraints.minQty);

  // Round to step size
  const stepSizeDecimals =
    constraints.stepSize.toString().split(".")[1]?.length || 0;
  const steps = Math.floor(quantity / constraints.stepSize);
  quantity = Number((steps * constraints.stepSize).toFixed(stepSizeDecimals));

  // Ensure still meets minimum after rounding
  if (quantity < constraints.minQty) {
    quantity = Number(constraints.minQty.toFixed(stepSizeDecimals));
  }

  // Check minimum notional value
  const notionalValue = quantity * currentPrice;
  if (notionalValue < constraints.minNotional) {
    const minQuantityForNotional = constraints.minNotional / currentPrice;
    const stepsForNotional = Math.ceil(
      minQuantityForNotional / constraints.stepSize
    );
    quantity = Number(
      (stepsForNotional * constraints.stepSize).toFixed(stepSizeDecimals)
    );
  }

  // Final validation
  if (quantity < constraints.minQty) {
    throw new Error(
      `Calculated quantity ${quantity} is below minimum required ${constraints.minQty}. Try increasing the portfolio percentage.`
    );
  }

  console.log(
    `Adjusted quantity: ${quantity}, min: ${constraints.minQty}, step: ${constraints.stepSize}`
  );

  return quantity;
}

/**
 * Validates sufficient balance for the order
 */
export function validateOrderBalance(
  side: PositionSide,
  quantity: number,
  currentPrice: number,
  availableBalance: number,
  requiredAsset: string
) {
  if (side === "Long") {
    const totalCost = quantity * currentPrice;
    if (totalCost > availableBalance) {
      throw new Error(
        `Insufficient ${requiredAsset} balance. Need: ${totalCost.toFixed(
          2
        )}, Available: ${availableBalance.toFixed(2)}`
      );
    }
  } else {
    if (quantity > availableBalance) {
      throw new Error(
        `Insufficient ${requiredAsset} balance. Need: ${quantity.toFixed(
          8
        )}, Available: ${availableBalance.toFixed(8)}`
      );
    }
  }
}

/**
 * Calculates stop loss and take profit prices
 */
export function calculateExitPrices(
  side: PositionSide,
  currentPrice: number,
  stopLossPercent: number | null,
  takeProfitPercent: number | null
) {
  let stopLossPrice: number | null = null;
  let takeProfitPrice: number | null = null;

  if (stopLossPercent) {
    stopLossPrice =
      side === "Long"
        ? currentPrice * (1 - stopLossPercent / 100)
        : currentPrice * (1 + stopLossPercent / 100);
  }

  if (takeProfitPercent) {
    takeProfitPrice =
      side === "Long"
        ? currentPrice * (1 + takeProfitPercent / 100)
        : currentPrice * (1 - takeProfitPercent / 100);
  }

  return { stopLossPrice, takeProfitPrice };
}


/**
 * Get the appropriate dashboard URL based on user role
 */
export function getDashboardUrlByRole(role: UserRole): string {
  return role === "ADMIN" ? "/dashboard" : "/customer/dashboard";
}
