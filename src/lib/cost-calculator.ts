import { TradingFormData } from "@/db/schema/order";
import { AssetPrice } from "@/types/trading";

// Binance trading fees (can be made configurable later)
export const BINANCE_FEES = {
  MAKER_FEE: 0.001, // 0.1%
  TAKER_FEE: 0.001, // 0.1%
  MARKET_ORDER_FEE: 0.001, // Market orders are always taker
} as const;

export interface CostBreakdown {
  // Base amounts
  quantity: number;
  price: number;
  subtotal: number;
  
  // Fees
  tradingFee: number;
  tradingFeeRate: number;
  
  // Totals
  totalCost: number; // For buy orders (subtotal + fees)
  netReceived: number; // For sell orders (subtotal - fees)
  
  // Display formatting
  formattedSubtotal: string;
  formattedFee: string;
  formattedTotal: string;
  
  // Additional info
  feeAsset: string;
  orderType: string;
  side: string;
}

export interface CostCalculationInput {
  orderData: TradingFormData;
  currentPrice: AssetPrice | null;
  baseAsset: string;
  quoteAsset: string;
}

export function calculateOrderCost({
  orderData,
  currentPrice,
  baseAsset,
  quoteAsset,
}: CostCalculationInput): CostBreakdown | null {
  // Return null if we don't have enough data
  if (!currentPrice?.price) {
    return null;
  }

  const marketPrice = parseFloat(currentPrice.price);
  let quantity = 0;
  let price = 0;
  let subtotal = 0;

  // Calculate based on order type and side
  if (orderData.type === "MARKET") {
    if (orderData.side === "BUY") {
      // For buy market orders
      if (orderData.quoteOrderQty && parseFloat(orderData.quoteOrderQty) > 0) {
        // User specified total amount to spend (e.g., $100 USDT)
        subtotal = parseFloat(orderData.quoteOrderQty);
        quantity = subtotal / marketPrice;
        price = marketPrice;
      } else if (orderData.quantity && parseFloat(orderData.quantity) > 0) {
        // User specified quantity to buy (e.g., 0.001 BTC)
        quantity = parseFloat(orderData.quantity);
        price = marketPrice;
        subtotal = quantity * price;
      } else {
        return null; // No valid input
      }
    } else {
      // For sell market orders
      if (orderData.quantity && parseFloat(orderData.quantity) > 0) {
        quantity = parseFloat(orderData.quantity);
        price = marketPrice;
        subtotal = quantity * price;
      } else {
        return null; // No valid input
      }
    }
  } else if (orderData.type === "LIMIT") {
    // For limit orders, we have both quantity and price
    if (orderData.quantity && orderData.price) {
      quantity = parseFloat(orderData.quantity);
      price = parseFloat(orderData.price);
      subtotal = quantity * price;
    } else {
      return null; // No valid input
    }
  }

  if (quantity <= 0 || price <= 0 || subtotal <= 0) {
    return null;
  }

  // Calculate trading fee
  const feeRate = orderData.type === "MARKET" 
    ? BINANCE_FEES.MARKET_ORDER_FEE 
    : BINANCE_FEES.MAKER_FEE; // Assume limit orders are makers

  let tradingFee = 0;
  let feeAsset = "";
  let totalCost = 0;
  let netReceived = 0;

  if (orderData.side === "BUY") {
    // For buy orders, fee is typically paid in the base asset (BTC)
    tradingFee = quantity * feeRate;
    feeAsset = baseAsset;
    totalCost = subtotal; // Fee is deducted from received amount, not added to cost
    netReceived = quantity - tradingFee;
  } else {
    // For sell orders, fee is typically paid in the quote asset (USDT)
    tradingFee = subtotal * feeRate;
    feeAsset = quoteAsset;
    totalCost = subtotal;
    netReceived = subtotal - tradingFee;
  }

  return {
    quantity,
    price,
    subtotal,
    tradingFee,
    tradingFeeRate: feeRate,
    totalCost,
    netReceived,
    formattedSubtotal: formatCurrency(subtotal, quoteAsset),
    formattedFee: formatCurrency(tradingFee, feeAsset),
    formattedTotal: orderData.side === "BUY" 
      ? formatCurrency(totalCost, quoteAsset)
      : formatCurrency(netReceived, quoteAsset),
    feeAsset,
    orderType: orderData.type,
    side: orderData.side,
  };
}

// Helper function to format currency amounts
function formatCurrency(amount: number, asset: string): string {
  if (asset === "USDT" || asset === "USD" || asset === "BUSD") {
    // Format fiat-like currencies with 2-8 decimal places
    if (amount >= 1) {
      return `${amount.toFixed(2)} ${asset}`;
    } else {
      return `${amount.toFixed(8)} ${asset}`;
    }
  } else {
    // Format crypto with 8 decimal places, but remove trailing zeros
    const formatted = amount.toFixed(8).replace(/\.?0+$/, "");
    return `${formatted} ${asset}`;
  }
}

// Helper function to get fee percentage display
export function getFeePercentageDisplay(feeRate: number): string {
  return `${(feeRate * 100).toFixed(2)}%`;
}

// Helper function to determine if order will likely be maker or taker
export function getExpectedFeeType(orderData: TradingFormData, currentPrice: AssetPrice | null): {
  type: "maker" | "taker";
  rate: number;
  description: string;
} {
  if (orderData.type === "MARKET") {
    return {
      type: "taker",
      rate: BINANCE_FEES.MARKET_ORDER_FEE,
      description: "Market orders are executed immediately (taker fee)"
    };
  }

  if (orderData.type === "LIMIT" && orderData.price && currentPrice?.price) {
    const limitPrice = parseFloat(orderData.price);
    const marketPrice = parseFloat(currentPrice.price);
    
    const isMakerLikely = (orderData.side === "BUY" && limitPrice < marketPrice) ||
                         (orderData.side === "SELL" && limitPrice > marketPrice);
    
    if (isMakerLikely) {
      return {
        type: "maker",
        rate: BINANCE_FEES.MAKER_FEE,
        description: "Limit order adds liquidity (maker fee)"
      };
    } else {
      return {
        type: "taker",
        rate: BINANCE_FEES.TAKER_FEE,
        description: "Limit order may execute immediately (taker fee)"
      };
    }
  }

  // Default to maker for limit orders
  return {
    type: "maker",
    rate: BINANCE_FEES.MAKER_FEE,
    description: "Limit order (estimated maker fee)"
  };
}
