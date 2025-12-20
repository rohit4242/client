"use server";

import { cache } from "react";
import db from "@/db";
import { isAdmin } from "@/lib/auth-utils";
import { GetSignalsInput, GetSignalsResult, SignalWithBot } from "../types/signal.types";

/**
 * Get signals with filters for admin
 */
export const getSignals = cache(async (
    input: GetSignalsInput = {}
): Promise<GetSignalsResult> => {
    try {
        const user = await isAdmin() ? "ADMIN" : "CUSTOMER";
        const sessionUserId = (await db.user.findFirst({ select: { id: true } }))?.id; // Mock check for demo, usually from session

        const { userId, botId, processed, status, action, limit = 50, offset = 0, search, visibleOnly } = input;

        const where: any = {};

        // Security: If not admin, force userId to session user and only show visible signals
        if (user !== "ADMIN") {
            where.bot = {
                portfolio: {
                    userId: sessionUserId
                }
            };
            where.visibleToCustomer = true;
        } else {
            // Filter by User (Admin only)
            if (userId) {
                where.bot = {
                    portfolio: {
                        userId: userId
                    }
                };
            }
            // Optional visibility filter
            if (visibleOnly) {
                where.visibleToCustomer = true;
            }
        }

        // Filter by Bot
        if (botId) {
            where.botId = botId;
        }

        // Filter by status (processed/pending/error)
        if (status === "PROCESSED") {
            where.processed = true;
        } else if (status === "PENDING") {
            where.processed = false;
            where.error = null;
        } else if (status === "ERROR") {
            where.error = { not: null };
        }

        // Filter by action
        if (action && action !== "ALL") {
            where.action = action;
        }

        // Search filter
        if (search) {
            where.OR = [
                { symbol: { contains: search, mode: 'insensitive' } },
                { message: { contains: search, mode: 'insensitive' } },
                { bot: { name: { contains: search, mode: 'insensitive' } } },
                {
                    bot: {
                        portfolio: {
                            user: {
                                name: { contains: search, mode: 'insensitive' }
                            }
                        }
                    }
                },
                {
                    bot: {
                        portfolio: {
                            user: {
                                email: { contains: search, mode: 'insensitive' }
                            }
                        }
                    }
                },
            ];
        }

        const [signals, total] = await Promise.all([
            db.signal.findMany({
                where,
                include: {
                    bot: {
                        include: {
                            portfolio: {
                                include: {
                                    user: {
                                        select: {
                                            id: true,
                                            name: true,
                                            email: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                orderBy: {
                    createdAt: "desc"
                },
                take: limit,
                skip: offset,
            }),
            db.signal.count({ where })
        ]);

        return {
            signals: signals.map((signal) => ({
                id: signal.id,
                botId: signal.botId,
                botName: signal.bot.name,
                customerName: signal.bot.portfolio.user.name,
                customerEmail: signal.bot.portfolio.user.email,
                customerId: signal.bot.portfolio.user.id,
                action: signal.action as any,
                symbol: signal.symbol,
                price: signal.price,
                message: signal.message,
                processed: signal.processed,
                error: signal.error,
                visibleToCustomer: signal.visibleToCustomer,
                createdAt: signal.createdAt.toISOString(),
                updatedAt: signal.updatedAt.toISOString(),
            })),
            total
        };
    } catch (error) {
        console.error("Error fetching all signals:", error);
        return {
            signals: [],
            total: 0
        };
    }
});
