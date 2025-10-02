import { z } from "zod";
import { Exchange, ExchangeSchema } from "./exchange";

// Simple enums for basic trading
export const OrderSide = z.enum(["BUY", "SELL"]);
export const OrderType = z.enum(["LIMIT", "MARKET"]);
export const TimeInForce = z.enum(["GTC", "IOC", "FOK"]);

// Base fields common to all orders
const baseFields = {
  symbol: z.string()
    .min(1, "Symbol is required")
    .regex(/^[A-Z0-9]+$/, "Symbol must contain only uppercase letters and numbers")
    .transform(val => val.toUpperCase()),
  
  side: OrderSide,
  type: OrderType,
  
};

// LIMIT order schema
export const LimitOrderSchema = z.object({
  ...baseFields,
  type: z.literal("LIMIT"),
  timeInForce: TimeInForce,
  
  quantity: z.string()
    .min(1, "Quantity is required")
    .refine(
      (val) => {
        const num = parseFloat(val);
        return !isNaN(num) && num > 0;
      },
      { message: "Quantity must be a positive number" }
    ),
  
  price: z.string()
    .min(1, "Price is required")
    .refine(
      (val) => {
        const num = parseFloat(val);
        return !isNaN(num) && num > 0;
      },
      { message: "Price must be a positive number" }
    ),
});

// MARKET order schema
export const MarketOrderSchema = z.object({
  ...baseFields,
  type: z.literal("MARKET"),
  
  // For MARKET orders, either quantity OR quoteOrderQty is required
  quantity: z.string()
    .refine(
      (val) => {
        if (!val) return true; // Allow empty if quoteOrderQty is provided
        const num = parseFloat(val);
        return !isNaN(num) && num > 0;
      },
      { message: "Quantity must be a positive number" }
    )
    .optional(),
  
  quoteOrderQty: z.string()
    .refine(
      (val) => {
        if (!val) return true; // Allow empty if quantity is provided
        const num = parseFloat(val);
        return !isNaN(num) && num > 0;
      },
      { message: "Quote order quantity must be a positive number" }
    )
    .optional(),
}).refine(
  (data) => data.quantity || data.quoteOrderQty,
  {
    message: "Either quantity or quote order quantity is required for market orders",
    path: ["quantity"]
  }
);

// Main trading form schema (union of LIMIT and MARKET)
export const TradingFormSchema = z.discriminatedUnion("type", [
  LimitOrderSchema,
  MarketOrderSchema,
]);

// TypeScript types
export type OrderSideType = z.infer<typeof OrderSide>;
export type OrderTypeType = z.infer<typeof OrderType>;
export type TimeInForceType = z.infer<typeof TimeInForce>;

export type LimitOrder = z.infer<typeof LimitOrderSchema>;
export type MarketOrder = z.infer<typeof MarketOrderSchema>;
export type TradingFormData = z.infer<typeof TradingFormSchema>;

export type CreateOrderData = {
  exchange: Exchange;
  order: TradingFormData;
  userId?: string;
  portfolioId?: string;
}
// same as Exchange type so use this Exchange type here
export const createOrderDataSchema = z.object({
  exchange: ExchangeSchema,
  order: TradingFormSchema,
  userId: z.string().optional(),
  portfolioId: z.string().optional(),
});

// Default form values
export const getDefaultValues = (type: OrderTypeType): Partial<TradingFormData> => {
  const base = {
    side: "BUY" as OrderSideType,
    symbol: "",
  };

  if (type === "LIMIT") {
    return {
      ...base,
      type: "LIMIT",
      timeInForce: "GTC" as TimeInForceType,
      quantity: "",
      price: "",
    };
  }

  return {
    ...base,
    type: "MARKET",
    quantity: "",
    quoteOrderQty: "",
  };
};

// Helper functions for validation
export const validateTradingForm = (data: unknown): TradingFormData => {
  return TradingFormSchema.parse(data);
};

export const safeValidateTradingForm = (data: unknown) => {
  return TradingFormSchema.safeParse(data);
};

// Popular trading pairs for form dropdowns
export const POPULAR_SYMBOLS = [
  "BTCUSDT",
  "ETHUSDT", 
  "BNBUSDT",
  "ADAUSDT",
  "SOLUSDT",
  "XRPUSDT",
  "DOTUSDT",
  "DOGEUSDT"
] as const;

