/**
 * Get Users Server Action
 */

"use server";

import { cache } from "react";
import { db } from "@/lib/db/client";
import { requireRole } from "@/lib/auth/session";
import { GetUsersInputSchema, toUserClient, type GetUsersInput, type GetUsersResult } from "../schemas/user.schema";

export const getUsers = cache(async (
    input: GetUsersInput = {}
): Promise<GetUsersResult> => {
    try {
        await requireRole("ADMIN");

        const validated = GetUsersInputSchema.parse(input);
        const { role, search, limit } = validated;

        const where = {
            ...(role && { role }),
            ...(search && {
                OR: [
                    { name: { contains: search, mode: "insensitive" as const } },
                    { email: { contains: search, mode: "insensitive" as const } },
                ],
            }),
        };

        const [users, total] = await Promise.all([
            db.user.findMany({
                where,
                orderBy: { createdAt: "desc" },
                ...(limit && { take: limit }),
            }),
            db.user.count({ where }),
        ]);

        return {
            users: users.map(toUserClient),
            total,
        };
    } catch (error) {
        console.error("Error fetching users:", error);
        return { users: [], total: 0 };
    }
});
