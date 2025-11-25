/**
 * Position Management Service
 * Handles creation, updates, and lifecycle of trading positions
 */

import db from "@/db";
import { BinanceOrderResponse } from "./exchange/types";
import { Source } from "@prisma/client";

export interface CreatePositionParams {
  portfolioId: string;
  symbol: string;
  side: "LONG" | "SHORT";
  type: "MARKET" | "LIMIT";
  entryPrice: number;
  quantity: number;
  stopLoss?: number;
  takeProfit?: number;
  accountType?: "SPOT" | "MARGIN";
  sideEffectType?: "NO_SIDE_EFFECT" | "MARGIN_BUY" | "AUTO_REPAY";
  source?: "MANUAL" | "SIGNAL_BOT";
}

export interface PositionResult {
  success: boolean;
  positionId?: string;
  orderId?: string;
  error?: string;
}

/**
 * Create a new position with entry order
 * @param params - Position creation parameters
 * @returns Position and order IDs
 */
export async function createPosition(
  params: CreatePositionParams
): Promise<PositionResult> {
  try {
    // Calculate entry value
    const entryValue = params.entryPrice * params.quantity;

    // Create position in database
    const position = await db.position.create({
      data: {
        portfolioId: params.portfolioId,
        symbol: params.symbol,
        side: params.side,
        type: params.type,
        entryPrice: params.entryPrice,
        quantity: params.quantity,
        entryValue,
        status: "OPEN",
        stopLoss: params.stopLoss,
        takeProfit: params.takeProfit,
        source: params.source as Source || "MANUAL",
        accountType: params.accountType || "SPOT",
        sideEffectType: params.sideEffectType || "NO_SIDE_EFFECT",
      },
    });

    // Create initial order in this position
    const order = await db.order.create({
      data: {
        positionId: position.id,
        portfolioId: params.portfolioId,
        orderId: "", // Will be updated with Binance order ID
        symbol: params.symbol,
        type: "ENTRY", // This is an entry order
        side: params.side === "LONG" ? "BUY" : "SELL",
        orderType: params.type,
        price: params.entryPrice,
        quantity: params.quantity,
        value: entryValue,
        status: "NEW",
        fillPercent: 0,
        pnl: 0,
        accountType: params.accountType || "SPOT",
        sideEffectType: params.sideEffectType || "NO_SIDE_EFFECT",
      },
    });

    return {
      success: true,
      positionId: position.id,
      orderId: order.id,
    };
  } catch (error) {
    console.error("[Position Service] Error creating position:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create position",
    };
  }
}

/**
 * Update position with Binance order execution data
 * @param positionId - Position database ID
 * @param orderId - Order database ID
 * @param binanceResponse - Binance order response
 * @returns Update result
 */
export async function updatePositionWithExecution(
  positionId: string,
  orderId: string,
  binanceResponse: BinanceOrderResponse
): Promise<PositionResult> {
  try {
    console.log("[Position Service] Updating position with execution:", {
      positionId,
      orderId,
      binanceResponse,
    });

    // Calculate values from Binance response
    const orderQuantity = binanceResponse.origQty || "0";

    // For MARKET orders, price is in fills array, not in response.price
    let orderPrice = binanceResponse.price || "0";
    if (
      parseFloat(orderPrice) === 0 &&
      binanceResponse.fills &&
      binanceResponse.fills.length > 0
    ) {
      // Use weighted average price from fills for market orders
      orderPrice = binanceResponse.fills[0].price;
    }

    const orderValue =
      binanceResponse.cummulativeQuoteQty ||
      (parseFloat(orderQuantity) * parseFloat(orderPrice)).toString();

    // Map Binance status to our database enums
    const binanceStatus = binanceResponse.status;
    let orderStatus:
      | "NEW"
      | "PENDING"
      | "FILLED"
      | "COMPLETED"
      | "CANCELED"
      | "REJECTED"
      | "PARTIALLY_FILLED";
    let positionStatus:
      | "OPEN"
      | "CLOSED"
      | "CANCELED"
      | "MARKET_CLOSED"
      | "FAILED";

    switch (binanceStatus) {
      case "FILLED":
        orderStatus = "FILLED";
        positionStatus = "OPEN"; // Position stays open until manually closed
        break;
      case "CANCELED":
        orderStatus = "CANCELED";
        positionStatus = "CANCELED";
        break;
      case "REJECTED":
        orderStatus = "REJECTED";
        positionStatus = "FAILED";
        break;
      case "PARTIALLY_FILLED":
        orderStatus = "PARTIALLY_FILLED";
        positionStatus = "OPEN";
        break;
      default:
        orderStatus = "PENDING";
        positionStatus = "OPEN";
    }

    // Update the order with Binance response
    await db.order.update({
      where: { id: orderId },
      data: {
        orderId: binanceResponse.orderId?.toString() || "",
        price: parseFloat(orderPrice),
        quantity: parseFloat(orderQuantity),
        value: parseFloat(orderValue),
        status: orderStatus,
        fillPercent: orderStatus === "FILLED" ? 100 : 0,
      },
    });

    // Update the position with actual values
    await db.position.update({
      where: { id: positionId },
      data: {
        entryPrice: parseFloat(orderPrice),
        quantity: parseFloat(orderQuantity),
        entryValue: parseFloat(orderValue),
        status: positionStatus,
      },
    });

    console.log("[Position Service] Position updated successfully");

    return {
      success: true,
      positionId,
      orderId,
    };
  } catch (error) {
    console.error("[Position Service] Error updating position:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update position",
    };
  }
}

/**
 * Close a position with exit order execution data
 * @param positionId - Position database ID
 * @param binanceResponse - Binance close order response
 * @returns Close result with P&L
 */
export async function closePosition(
  positionId: string,
  binanceResponse: BinanceOrderResponse
): Promise<{
  success: boolean;
  pnl?: number;
  pnlPercent?: number;
  error?: string;
}> {
  try {
    // Get the existing position
    const existingPosition = await db.position.findUnique({
      where: { id: positionId },
      include: { orders: true },
    });

    if (!existingPosition) {
      return { success: false, error: "Position not found" };
    }

    if (existingPosition.status !== "OPEN") {
      return { success: false, error: "Position is not open" };
    }

    // Calculate values from Binance response
    const closeQuantity = binanceResponse.origQty || "0";
    const closePrice =
      binanceResponse.price ||
      binanceResponse.fills?.[0]?.price ||
      "0";
    const closeValue =
      binanceResponse.cummulativeQuoteQty ||
      (parseFloat(closeQuantity) * parseFloat(closePrice)).toString();

    // Calculate PnL
    const entryValue = existingPosition.entryValue;
    const exitValue = parseFloat(closeValue);
    const pnl =
      existingPosition.side === "LONG"
        ? exitValue - entryValue // Long: profit when exit > entry
        : entryValue - exitValue; // Short: profit when entry > exit

    const pnlPercent = entryValue > 0 ? (pnl / entryValue) * 100 : 0;

    // Map Binance status to our database enums
    const binanceStatus = binanceResponse.status;
    let orderStatus:
      | "NEW"
      | "PENDING"
      | "FILLED"
      | "COMPLETED"
      | "CANCELED"
      | "REJECTED"
      | "PARTIALLY_FILLED";
    let positionStatus:
      | "OPEN"
      | "CLOSED"
      | "CANCELED"
      | "MARKET_CLOSED"
      | "FAILED";

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
    await db.order.create({
      data: {
        positionId: existingPosition.id,
        portfolioId: existingPosition.portfolioId,
        orderId: binanceResponse.orderId?.toString() || "",
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
        accountType: existingPosition.accountType,
        sideEffectType: existingPosition.sideEffectType,
      },
    });

    // Update the position with close details
    await db.position.update({
      where: { id: positionId },
      data: {
        status: positionStatus,
        exitPrice: parseFloat(closePrice),
        exitValue: parseFloat(closeValue),
        pnl: pnl,
        pnlPercent: pnlPercent,
        closedAt: positionStatus === "CLOSED" ? new Date() : null,
      },
    });

    console.log("[Position Service] Position closed successfully");

    return {
      success: true,
      pnl,
      pnlPercent,
    };
  } catch (error) {
    console.error("[Position Service] Error closing position:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to close position",
    };
  }
}

/**
 * Delete a position and its orders (cleanup after failed order)
 * @param positionId - Position database ID
 * @param orderId - Order database ID
 */
export async function deletePosition(
  positionId: string,
  orderId: string
): Promise<void> {
  try {
    await db.order.delete({ where: { id: orderId } });
    await db.position.delete({ where: { id: positionId } });
    console.log("[Position Service] Position deleted successfully");
  } catch (error) {
    console.error("[Position Service] Error deleting position:", error);
    // Don't throw, just log - this is cleanup
  }
}

