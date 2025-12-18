/**
 * User Zod Schemas
 * 
 * Schemas for user management (admin features).
 */

import { z } from "zod";
import { Role } from "@prisma/client";

// ============================================================================
// INPUT SCHEMAS
// ============================================================================

export const GetUsersInputSchema = z.object({
    role: z.nativeEnum(Role).optional(),
    search: z.string().optional(),
    limit: z.number().int().positive().max(1000).optional(),
});

export const GetUserInputSchema = z.object({
    id: z.string().uuid("Invalid user ID"),
});

// ============================================================================
// OUTPUT SCHEMAS
// ============================================================================

export const UserSchema = z.object({
    id: z.string().uuid(),
    name: z.string(),
    email: z.string().email(),
    role: z.nativeEnum(Role),
    emailVerified: z.boolean(),
    image: z.string().nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
});

export const UserClientSchema = UserSchema.extend({
    createdAt: z.string(),
    updatedAt: z.string(),
});

export const GetUsersResultSchema = z.object({
    users: z.array(UserClientSchema),
    total: z.number(),
});

export const GetUserResultSchema = z.object({
    user: UserClientSchema.nullable(),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type GetUsersInput = z.infer<typeof GetUsersInputSchema>;
export type GetUserInput = z.infer<typeof GetUserInputSchema>;
export type User = z.infer<typeof UserSchema>;
export type UserClient = z.infer<typeof UserClientSchema>;
export type GetUsersResult = z.infer<typeof GetUsersResultSchema>;
export type GetUserResult = z.infer<typeof GetUserResultSchema>;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function toUserClient(user: User): UserClient {
    return {
        ...user,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
    };
}
