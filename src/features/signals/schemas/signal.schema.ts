import { z } from "zod";
import { Action } from "@prisma/client";

export const SignalActionSchema = z.nativeEnum(Action);

export const GetSignalsInputSchema = z.object({
    userId: z.string().optional(),
    botId: z.string().optional(),
    processed: z.boolean().optional(),
    limit: z.number().optional().default(50),
    offset: z.number().optional().default(0),
    search: z.string().optional(),
    status: z.enum(["ALL", "PROCESSED", "PENDING", "ERROR"]).optional().default("ALL"),
    action: z.union([SignalActionSchema, z.literal("ALL")]).optional().default("ALL"),
    visibleOnly: z.boolean().optional(),
});

export const UpdateSignalInputSchema = z.object({
    id: z.string(),
    action: SignalActionSchema.optional(),
    symbol: z.string().optional(),
    price: z.number().nullable().optional(),
    message: z.string().nullable().optional(),
    processed: z.boolean().optional(),
    visibleToCustomer: z.boolean().optional(),
});

export const CreateSignalInputSchema = z.object({
    botId: z.string(),
    action: SignalActionSchema,
    symbol: z.string(),
    price: z.number().optional(),
    message: z.string().optional(),
    visibleToCustomer: z.boolean().optional().default(true),
});
