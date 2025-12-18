"use server";

import { revalidatePath } from "next/cache";
import db from "@/db";
import { getUserWithRole } from "@/lib/auth-utils";
import { getSymbolConstraints, formatQuantityToLotSize } from "@/lib/signal-bot/exchange-info-utils";
import { getPriceBySymbol } from "@/lib/trading-utils";
import {
    ValidateTradeInputSchema,
    type ValidateTradeInput,
    type ValidateTradeResult
} from "../schemas/bot.schema";

/**
 * Validates a trade amount against exchange constraints
 * 
 * Replaces the legacy API endpoint: /api/signal-bots/validate-and-format
 */
export async function validateTrade(input: ValidateTradeInput): Promise<{ success: boolean; data?: ValidateTradeResult; error?: string }> {
    try {
        const { user } = await getUserWithRole();
        if (!user) {
            return { success: false, error: "Unauthorized" };
        }

        const validatedInput = ValidateTradeInputSchema.parse(input);
        const { symbol, tradeAmount, tradeAmountType, exchangeId } = validatedInput;

        // Get exchange
        const exchange = await db.exchange.findUnique({
            where: { id: exchangeId },
            select: { apiKey: true, apiSecret: true, isActive: true },
        });

        if (!exchange || !exchange.isActive) {
            return { success: false, error: "Exchange not found or not active" };
        }

        const config = {
            apiKey: exchange.apiKey,
            apiSecret: exchange.apiSecret,
        };

        // Fetch constraints and current price in parallel
        const [constraints, priceData] = await Promise.all([
            getSymbolConstraints(config, symbol),
            getPriceBySymbol(config, symbol),
        ]).catch(err => {
            console.error("Error fetching exchange data:", err);
            throw new Error(`Failed to fetch exchange data for ${symbol}`);
        });

        if (!constraints) {
            return { success: false, error: `Failed to fetch trading constraints for ${symbol}` };
        }

        const currentPrice = parseFloat(priceData.price);
        const errors: string[] = [];
        const warnings: string[] = [];

        // Calculate base quantity
        let baseQuantity = 0;
        if (tradeAmountType === "QUOTE") {
            baseQuantity = tradeAmount / currentPrice;
        } else {
            baseQuantity = tradeAmount;
        }

        // Format to LOT_SIZE
        const formattedQuantity = formatQuantityToLotSize(baseQuantity, {
            minQty: constraints.minQty,
            maxQty: constraints.maxQty,
            stepSize: constraints.stepSize,
        });

        // Validate constraints
        if (formattedQuantity < constraints.minQty) {
            errors.push(
                `Quantity ${formattedQuantity.toFixed(8)} is below minimum ${constraints.minQty}`
            );
        }

        if (formattedQuantity > constraints.maxQty) {
            errors.push(
                `Quantity ${formattedQuantity.toFixed(8)} exceeds maximum ${constraints.maxQty}`
            );
        }

        // Calculate notional value
        const notionalValue = formattedQuantity * currentPrice;

        if (notionalValue < constraints.minNotional) {
            errors.push(
                `Order value $${notionalValue.toFixed(2)} is below minimum notional $${constraints.minNotional}`
            );
        }

        // Check if formatting changed the amount significantly
        const originalNotional = tradeAmountType === "QUOTE" ? tradeAmount : tradeAmount * currentPrice;
        const difference = Math.abs(notionalValue - originalNotional);
        const percentDiff = (difference / originalNotional) * 100;

        if (percentDiff > 1) {
            warnings.push(
                `Amount was adjusted by ${percentDiff.toFixed(2)}% to meet trading constraints`
            );
        }

        const result: ValidateTradeResult = {
            valid: errors.length === 0,
            formattedQuantity,
            formattedAmountType: "BASE",
            constraints: {
                minQty: constraints.minQty,
                maxQty: constraints.maxQty,
                stepSize: constraints.stepSize,
                minNotional: constraints.minNotional,
            },
            currentPrice,
            notionalValue,
            errors: errors.length > 0 ? errors : undefined,
            warnings: warnings.length > 0 ? warnings : undefined,
        };

        return { success: true, data: result };
    } catch (error) {
        console.error("Error in validateTrade action:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to validate trade amount"
        };
    }
}
