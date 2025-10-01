import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import db from "@/db";

interface ClosePositionRequest {
  positionId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  binanceResponse: any;
}

export async function closePosition(request: ClosePositionRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    throw new Error("User not authenticated");
  }

  try {
    // Get the existing position
    const existingPosition = await db.position.findUnique({
      where: { id: request.positionId },
      include: { orders: true },
    });

    if (!existingPosition) {
      throw new Error("Position not found");
    }

    if (existingPosition.status !== "OPEN") {
      throw new Error("Position is not open");
    }

    // Calculate values from Binance response
    const closeQuantity = request.binanceResponse.origQty || "0";
    const closePrice = request.binanceResponse.price || request.binanceResponse.fills?.[0]?.price || "0";
    const closeValue = request.binanceResponse.cummulativeQuoteQty ||
      (parseFloat(closeQuantity) * parseFloat(closePrice)).toString();

    // Calculate PnL
    const entryValue = existingPosition.entryValue;
    const exitValue = parseFloat(closeValue);
    const pnl = existingPosition.side === "LONG" 
      ? exitValue - entryValue  // Long: profit when exit > entry
      : entryValue - exitValue; // Short: profit when entry > exit

    const pnlPercent = entryValue > 0 ? (pnl / entryValue) * 100 : 0;

    // Map Binance status to our database enums
    const binanceStatus = request.binanceResponse.status;
    let orderStatus: "NEW" | "PENDING" | "FILLED" | "COMPLETED" | "CANCELED" | "REJECTED" | "PARTIALLY_FILLED";
    let positionStatus: "OPEN" | "CLOSED" | "CANCELED" | "MARKET_CLOSED" | "FAILED";

    switch (binanceStatus) {
      case "FILLED":
        orderStatus = "FILLED";
        positionStatus = "CLOSED";
        break;
      case "CANCELED":
        orderStatus = "CANCELED";
        positionStatus = "OPEN"; // Keep position open if close order was canceled
        break;
      case "REJECTED":
        orderStatus = "REJECTED";
        positionStatus = "OPEN"; // Keep position open if close order was rejected
        break;
      case "PARTIALLY_FILLED":
        orderStatus = "PARTIALLY_FILLED";
        positionStatus = "OPEN"; // Keep position open for partial fills
        break;
      default:
        orderStatus = "PENDING";
        positionStatus = "OPEN";
    }

    // Create close order record
    const closeOrder = await db.order.create({
      data: {
        positionId: existingPosition.id,
        portfolioId: existingPosition.portfolioId,
        orderId: request.binanceResponse.orderId?.toString() || "",
        symbol: existingPosition.symbol,
        type: "EXIT", // This is an exit order
        side: existingPosition.side === "LONG" ? "SELL" : "BUY", // Opposite side
        orderType: "MARKET", // Close orders are typically market orders
        price: parseFloat(closePrice),
        quantity: parseFloat(closeQuantity),
        value: parseFloat(closeValue),
        status: orderStatus,
        fillPercent: orderStatus === "FILLED" ? 100 : 0,
        pnl: pnl,
      },
    });

    // Update the position with close details
    const updatedPosition = await db.position.update({
      where: { id: request.positionId },
      data: {
        status: positionStatus,
        exitPrice: parseFloat(closePrice),
        exitValue: parseFloat(closeValue),
        pnl: pnl,
        pnlPercent: pnlPercent,
      },
    });

    console.log("Position closed successfully");

    return {
      success: true,
      positionId: updatedPosition.id,
      orderId: closeOrder.id,
      binanceOrderId: request.binanceResponse.orderId?.toString() || "",
      pnl: pnl,
      pnlPercent: pnlPercent,
      status: positionStatus,
    };
  } catch (error) {
    console.error("Error closing position:", error);
    throw new Error("Failed to close position");
  }
}

