/**
 * Prisma Client Singleton
 * 
 * Ensures only one instance of Prisma Client is created
 * to prevent connection pool exhaustion in development.
 */

import { PrismaClient } from "@prisma/client";

declare global {
    // eslint-disable-next-line no-var
    var prisma: PrismaClient | undefined;
}

export const db = global.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") {
    global.prisma = db;
}
