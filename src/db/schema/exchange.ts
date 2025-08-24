// create exchange schema with zod

import { z } from "zod";

export const createExchangeSchema = z.object({
  name: z.string().min(1),
  accountName: z.string().min(1),
  apiKey: z.string().min(1),
  apiSecret: z.string().min(1),
  positionMode: z.enum(["OneWay", "Hedge"]),
});

export const updateExchangeSchema = z.object({
  name: z.string().min(1).optional(),
  accountName: z.string().min(1).optional(),
  apiKey: z.string().min(1).optional(),
  apiSecret: z.string().min(1).optional(),
  positionMode: z.enum(["OneWay", "Hedge"]).optional(),
  isActive: z.boolean().optional(),
});

export const exchangeSchema = z.object({
  id: z.string(),
  name: z.string(),
  accountName: z.string().nullable(),
  apiKey: z.string(),
  apiSecret: z.string(),
  positionMode: z.enum(["OneWay", "Hedge"]),
  isActive: z.boolean(),
  lastSyncedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  userId: z.string(),
  userAccountId: z.string(),
  totalValue: z.number().nullable(),
});

export const ExchangeSchema = exchangeSchema;
export type Exchange = z.infer<typeof ExchangeSchema>;
export type CreateExchange = z.infer<typeof createExchangeSchema>;
export type UpdateExchange = z.infer<typeof updateExchangeSchema>;





