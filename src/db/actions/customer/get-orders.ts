"use server";

import { getUserWithRole } from "@/lib/auth-utils";
import db from "@/db";

export interface CustomerOrder {
  id: string;
  orderId: string;
  symbol: string;
  type: string;
  side: string;
  orderType: string;
  price: number;
  quantity: number;
  value: number;
  status: string;
  fillPercent: number;
  pnl: number;
  details: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function getOrders(limit: number = 50): Promise<CustomerOrder[]> {
  try {
    const user = await getUserWithRole();

    if (!user) {
      throw new Error("Unauthorized");
    }

    // Get user's portfolio
    const portfolio = await db.portfolio.findFirst({
      where: {
        userId: user.id,
      },
    });

    if (!portfolio) {
      return [];
    }

    // Get orders
    const orders = await db.order.findMany({
      where: {
        portfolioId: portfolio.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    });

    return orders.map((order) => ({
      id: order.id,
      orderId: order.orderId,
      symbol: order.symbol,
      type: order.type,
      side: order.side,
      orderType: order.orderType,
      price: order.price,
      quantity: order.quantity,
      value: order.value,
      status: order.status,
      fillPercent: order.fillPercent,
      pnl: order.pnl,
      details: order.details,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
    }));
  } catch (error) {
    console.error("Error fetching orders:", error);
    return [];
  }
}

