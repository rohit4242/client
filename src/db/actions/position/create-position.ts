import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import db from "@/db";

export interface CreatePositionRequest {
  symbol: string;
  side: "Long" | "Short";
  type: "Market" | "Limit";
  entryPrice: number; // For market orders, this will be current price
  quantity: number;
  stopLoss?: number;
  takeProfit?: number;
  portfolioId: string;
}

export async function createPosition(
  request: CreatePositionRequest
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    throw new Error("User not authenticated");
  }

  try {
    // Calculate entry value
    const entryValue = request.entryPrice * request.quantity;

    // Create position in database
    const position = await db.position.create({
      data: {
        portfolioId: request.portfolioId,
        symbol: request.symbol,
        side: request.side === "Long" ? "LONG" : "SHORT",
        type: request.type === "Market" ? "MARKET" : "LIMIT",
        entryPrice: request.entryPrice,
        quantity: request.quantity,
        entryValue,
        status: "OPEN",
        stopLoss: request.stopLoss,
        takeProfit: request.takeProfit,
        source: "MANUAL",
      },
    });

    // Create initial order in this position
    const order = await db.order.create({
      data: {
        positionId: position.id,
        portfolioId: request.portfolioId,
        orderId: "", // Will be updated with Binance order ID
        symbol: request.symbol,
        type: "ENTRY", // This is an entry order
        side: request.side === "Long" ? "BUY" : "SELL",
        orderType: request.type === "Market" ? "MARKET" : "LIMIT",
        price: request.entryPrice,
        quantity: request.quantity,
        value: entryValue,
        status: "NEW",
        fillPercent: 0,
        pnl: 0,
        
      },
    });

    return {
      success: true,
      positionId: position.id,
      orderId: order.id,
    };
  } catch (error) {
    console.error("Error creating position:", error);
    throw new Error("Failed to create position");
  }
}
