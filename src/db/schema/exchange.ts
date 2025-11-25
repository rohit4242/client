// create exchange schema with zod

import { z } from "zod";

export const createExchangeSchema = z.object({
  name: z.string().min(1),
  apiKey: z.string().min(1),
  apiSecret: z.string().min(1),
  positionMode: z.enum(["One_Way", "Hedge"]),
});

export const updateExchangeSchema = z.object({
  name: z.string().min(1).optional(),
  apiKey: z.string().min(1).optional(),
  apiSecret: z.string().min(1).optional(),
  positionMode: z.enum(["One_Way", "Hedge"]).optional(),
  isActive: z.boolean().optional(),
});

export const exchangeSchema = z.object({
  id: z.string(),
  name: z.string(),
  apiKey: z.string(),
  apiSecret: z.string(),
  positionMode: z.enum(["One_Way", "Hedge"]),
  isActive: z.boolean(),
  lastSyncedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  portfolioId: z.string(),
  totalValue: z.number().nullable(),
});

// Simplified schema for API requests (only essential trading fields)
export const TradingExchangeSchema = z.object({
  id: z.string(),
  name: z.string(),
  apiKey: z.string(),
  apiSecret: z.string(),
  // Optional fields for trading
  positionMode: z.enum(["One_Way", "Hedge"]).optional(),
  isActive: z.boolean().optional(),
  lastSyncedAt: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  portfolioId: z.string().optional(),
  totalValue: z.number().nullable().optional(),
});

export const ExchangeSchema = exchangeSchema;
export type Exchange = z.infer<typeof ExchangeSchema>;
export type TradingExchange = z.infer<typeof TradingExchangeSchema>;
export type CreateExchange = z.infer<typeof createExchangeSchema>;
export type UpdateExchange = z.infer<typeof updateExchangeSchema>;





