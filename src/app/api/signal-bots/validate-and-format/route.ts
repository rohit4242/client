import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import db from "@/db";
import { getSymbolConstraints } from "@/lib/signal-bot/exchange-info-utils";
import { getPriceBySymbol } from "@/lib/trading-utils";
import { formatQuantityToLotSize } from "@/lib/signal-bot/exchange-info-utils";

interface ValidateFormatRequest {
    symbol: string;
    tradeAmount: number;
    tradeAmountType: "QUOTE" | "BASE";
    exchangeId: string;
}

interface ValidateFormatResponse {
    valid: boolean;
    formattedQuantity?: number;
    formattedAmountType?: "BASE";
    constraints?: {
        minQty: number;
        maxQty: number;
        stepSize: number;
        minNotional: number;
    };
    currentPrice?: number;
    notionalValue?: number;
    errors?: string[];
    warnings?: string[];
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body: ValidateFormatRequest = await request.json();
        const { symbol, tradeAmount, tradeAmountType, exchangeId } = body;

        // Validate input
        if (!symbol || !tradeAmount || !tradeAmountType || !exchangeId) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Get exchange
        const exchange = await db.exchange.findUnique({
            where: { id: exchangeId },
            select: { apiKey: true, apiSecret: true, isActive: true },
        });

        if (!exchange || !exchange.isActive) {
            return NextResponse.json(
                { error: "Exchange not found or not active" },
                { status: 404 }
            );
        }

        const config = {
            apiKey: exchange.apiKey,
            apiSecret: exchange.apiSecret,
        };

        // Fetch constraints and current price in parallel
        const [constraints, priceData] = await Promise.all([
            getSymbolConstraints(config, symbol),
            getPriceBySymbol(config, symbol),
        ]);

        if (!constraints) {
            return NextResponse.json(
                { error: `Failed to fetch trading constraints for ${symbol}` },
                { status: 500 }
            );
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

        const response: ValidateFormatResponse = {
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

        return NextResponse.json(response);
    } catch (error) {
        console.error("Error validating trade amount:", error);
        return NextResponse.json(
            {
                error: "Failed to validate trade amount",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}
