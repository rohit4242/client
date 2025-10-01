import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import db from "@/db";

export interface UpdatePositionRequest {
  positionId: string;
  orderId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  binanceResponse: any;
}

export async function updatePosition(request: UpdatePositionRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    throw new Error("User not authenticated");
  }

  console.log("updating position: ", request.binanceResponse);

  // Calculate values from Binance response
  const orderQuantity = request.binanceResponse.origQty || "0";
  
  // For MARKET orders, price is in fills array, not in response.price
  let orderPrice = request.binanceResponse.price || "0";
  if (parseFloat(orderPrice) === 0 && request.binanceResponse.fills && request.binanceResponse.fills.length > 0) {
    // Use weighted average price from fills for market orders
    orderPrice = request.binanceResponse.fills[0].price;
  }
  
  const orderValue =
    request.binanceResponse.cummulativeQuoteQty ||
    (parseFloat(orderQuantity) * parseFloat(orderPrice)).toString();

  // Map Binance status to our database enums
  const binanceStatus = request.binanceResponse.status;
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

  console.log("updating position: ", {
    positionId: request.positionId,
    orderId: request.orderId,
    binanceResponse: request.binanceResponse,
    orderPrice,
    orderQuantity,
    orderValue,
    orderStatus,
    positionStatus,
  });

  // Update the order with Binance response
  await db.order.update({
    where: { id: request.orderId },
    data: {
      orderId: request.binanceResponse.orderId?.toString() || "",
      price: parseFloat(orderPrice),
      quantity: parseFloat(orderQuantity),
      value: parseFloat(orderValue),
      status: orderStatus,
      fillPercent: orderStatus === "FILLED" ? 100 : 0,
    },
  });

  // Update the position with actual values
  await db.position.update({
    where: { id: request.positionId },
    data: {
      entryPrice: parseFloat(orderPrice),
      quantity: parseFloat(orderQuantity),
      entryValue: parseFloat(orderValue),
      status: positionStatus,
    },
  });

  console.log("Order and position updated successfully");

  return {
    success: true,
    positionId: request.positionId,
    orderId: request.orderId,
    binanceOrderId: request.binanceResponse.orderId?.toString() || "",
  };
}
