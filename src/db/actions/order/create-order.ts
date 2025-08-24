import { OrderSide, OrderStatus, OrderType } from "@prisma/client";
import db from "@/db";

export interface CreateOrderParams {
  symbol: string;
  side: "BUY" | "SELL";
  type: "MARKET" | "LIMIT";
  price: number;
  quantity: number;
  value: number;
  userAccountId: string;
  status?: OrderStatus;
}

export interface BinanceOrderResponse {
  symbol: string;
  orderId: number;
  orderListId: number;
  clientOrderId: string;
  transactTime: number;
  price: string;
  origQty: string;
  executedQty: string;
  cummulativeQuoteQty: string;
  status: string;
  timeInForce: string;
  type: string;
  side: string;
  stopPrice?: string;
  icebergQty?: string;
  time?: number;
  updateTime?: number;
  isWorking?: boolean;
  workingTime?: number;
  origQuoteOrderQty?: string;
  selfTradePreventionMode?: string;
  fills?: Array<{
    price: string;
    qty: string;
    commission: string;
    commissionAsset: string;
    tradeId: number;
  }>;
}

// Convert Zod types to Prisma enums
function mapOrderSide(side: "BUY" | "SELL"): OrderSide {
  return side === "BUY" ? OrderSide.Buy : OrderSide.Sell;
}

function mapOrderType(type: "MARKET" | "LIMIT"): OrderType {
  return type === "MARKET" ? OrderType.Market : OrderType.Limit;
}

function mapOrderStatus(status: string): OrderStatus {
  switch (status) {
    case "FILLED":
      return OrderStatus.Filled;
    case "CANCELED":
    case "CANCELLED":
      return OrderStatus.Canceled;
    case "NEW":
    case "PARTIALLY_FILLED":
    case "PENDING_CANCEL":
    default:
      return OrderStatus.Pending;
  }
}

export async function createOrder(params: CreateOrderParams) {
  try {
    const order = await db.order.create({
      data: {
        symbol: params.symbol,
        side: mapOrderSide(params.side),
        type: mapOrderType(params.type),
        price: params.price,
        quantity: params.quantity,
        value: params.value,
        status: params.status || OrderStatus.Pending,
        userAccountId: params.userAccountId,
      },
    });

    return order;
  } catch (error) {
    console.error("Error creating order in database:", error);
    throw new Error("Failed to create order in database");
  }
}

export async function updateOrderFromBinanceResponse(
  orderId: string,
  binanceResponse: BinanceOrderResponse
) {
  try {
    const updatedOrder = await db.order.update({
      where: { id: orderId },
      data: {
        status: mapOrderStatus(binanceResponse.status),
        price: parseFloat(binanceResponse.price),
        quantity: parseFloat(binanceResponse.executedQty || binanceResponse.origQty),
        updatedAt: new Date(binanceResponse.transactTime || Date.now()),
      },
    });

    return updatedOrder;
  } catch (error) {
    console.error("Error updating order in database:", error);
    throw new Error("Failed to update order in database");
  }
}
