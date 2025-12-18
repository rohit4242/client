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

        // Use userId from input if provided (admin creating for customer)
        const targetUserId = userId || user.id;

        // Get user's portfolio
        const portfolio = await db.portfolio.findFirst({
            where: { userId: targetUserId },
        });

        if (!portfolio) {
            return {
                success: false,
                error: "Portfolio not found - Please add an exchange first",
            };
        }

        // Verify exchange exists and belongs to portfolio
        const exchange = await db.exchange.findFirst({
            where: {
                id: botData.exchangeId,
                portfolioId: portfolio.id,
            },
        });

        if (!exchange) {
            return {
                success: false,
                error: "Exchange not found or doesn't belong to this portfolio",
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
