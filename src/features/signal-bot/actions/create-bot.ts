/**
 * Create Bot Server Action
 * 
 * Creates a new signal bot with full configuration.
 */

"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import { getUserWithRole } from "@/lib/auth-utils";
import { handleServerError, successResult, ServerActionResult } from "@/lib/validation/error-handler";
import { CreateBotInputSchema, enrichBotWithExchange, toBotClient, type CreateBotInput, type BotWithExchange } from "../schemas/bot.schema";

/**
 * Create new signal bot
 */
export async function createBot(
    input: CreateBotInput
): Promise<ServerActionResult<BotWithExchange>> {
    try {
        const user = await getUserWithRole();
        if (!user) throw new Error("Unauthorized");

        // Validate input
        const validated = CreateBotInputSchema.parse(input);
        const { userId, ...botData } = validated;

        // Verify exchange exists and get its portfolio
        const exchange = await db.exchange.findUnique({
            where: { id: botData.exchangeId },
            include: { portfolio: true }
        });

        if (!exchange) {
            return {
                success: false,
                error: "Exchange not found",
            };
        }

        const portfolio = exchange.portfolio;

        // Permission check:
        // 1. If user is owner of portfolio
        // 2. If user is admin
        // 3. If user is agent and customer is assigned to them
        const isOwner = portfolio.userId === user.id;
        const admin = user.role === "ADMIN";

        let isAssignedAgent = false;
        if (user.role === "AGENT") {
            const customer = await db.user.findUnique({
                where: { id: portfolio.userId },
                select: { agentId: true }
            });
            isAssignedAgent = customer?.agentId === user.id;
        }

        if (!isOwner && !admin && !isAssignedAgent) {
            return {
                success: false,
                error: "You don't have permission to create a bot for this exchange/portfolio",
            };
        }

        // Create bot
        const bot = await db.bot.create({
            data: {
                ...botData,
                portfolioId: portfolio.id,
                // Generate unique webhook secret
                webhookSecret: crypto.randomUUID(),
            },
            include: {
                exchange: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        // Revalidate paths
        revalidatePath("/signal-bot");
        revalidatePath("/bots");

        const clientBot = toBotClient(bot);
        const enrichedBot = enrichBotWithExchange(clientBot, bot.exchange);

        return successResult(enrichedBot);
    } catch (error) {
        return handleServerError(error, "Failed to create bot");
    }
}
