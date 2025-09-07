"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import db from "@/db";
import { Spot } from "@binance/spot";

export interface BinanceOrder {
  symbol: string;
  orderId: number;
  orderListId: number;
  clientOrderId: string;
  price: string;
  origQty: string;
  executedQty: string;
  cummulativeQuoteQty: string;
  status: string;
  timeInForce: string;
  type: string;
  side: string;
  stopPrice: string;
  icebergQty: string;
  time: number;
  updateTime: number;
  isWorking: boolean;
  origQuoteOrderQty: string;
  workingTime: number;
  selfTradePreventionMode: string;
}

export interface ProcessedOrder {
  id: string;
  symbol: string;
  orderId: number;
  side: string;
  type: string;
  price: number;
  quantity: number;
  executedQty: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  value: number;
}

export const getOrders = async (symbol?: string, limit: number = 500) => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      throw new Error("Unauthorized");
    }

    // Get user's exchange credentials
    const userAccount = await db.userAccount.findFirst({
      where: {
        userId: session.user.id,
      },
      include: {
        exchanges: {
          where: {
            isActive: true,
          },
          take: 1,
        },
      },
    });

    if (!userAccount || !userAccount.exchanges.length) {
      console.log("No active exchange found for user");
      return [];
    }

    const exchange = userAccount.exchanges[0];

    // Configure Binance client
    const configurationRestAPI = {
      apiKey: exchange.apiKey,
      apiSecret: exchange.apiSecret,
    };

    const client = new Spot({
      configurationRestAPI,
    });

    // Fetch orders from Binance
    let binanceOrders: unknown[] = [];

    if (symbol) {
      // Fetch orders for specific symbol
      const params = {
        symbol,
        limit,
      };
      const response = await client.restAPI.allOrders(params);
      binanceOrders = await response.data();
    } else {
      // For getting all orders across symbols, we'll fetch from popular trading pairs
      // This is a workaround since Binance requires a symbol for allOrders endpoint
      const popularSymbols = [
        'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'XRPUSDT', 'ADAUSDT', 
        'SOLUSDT', 'DOGEUSDT', 'DOTUSDT', 'LTCUSDT', 'LINKUSDT'
      ];

      const allOrdersPromises = popularSymbols.map(async (sym) => {
        try {
          const response = await client.restAPI.allOrders({
            symbol: sym,
            limit: Math.ceil(limit / popularSymbols.length), // Distribute limit across symbols
          });
          return await response.data();
        } catch {
          // Symbol might not exist or user might not have orders for it
          console.log(`No orders found for ${sym}`);
          return [];
        }
      });

      const allOrdersResults = await Promise.all(allOrdersPromises);
      binanceOrders = allOrdersResults.flat();
    }

    // Process and format orders for frontend
    const processedOrders: ProcessedOrder[] = binanceOrders.map((order: unknown) => {
      const orderData = order as Record<string, unknown>;
      const price = parseFloat(String(orderData.price || "0")) || 0;
      const quantity = parseFloat(String(orderData.origQty || "0")) || 0;
      const executedQty = parseFloat(String(orderData.executedQty || "0")) || 0;
      const value = price * quantity;

      return {
        id: `${orderData.orderId || 0}`,
        symbol: String(orderData.symbol || ""),
        orderId: Number(orderData.orderId || 0),
        side: String(orderData.side || ""),
        type: String(orderData.type || ""),
        price,
        quantity,
        executedQty,
        status: String(orderData.status || ""),
        createdAt: new Date(Number(orderData.time) || Date.now()).toISOString(),
        updatedAt: new Date(Number(orderData.updateTime) || Date.now()).toISOString(),
        value,
      };
    });

    // Sort by creation time (newest first)
    processedOrders.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return processedOrders;
  } catch (error) {
    console.error("Error fetching orders from Binance:", error);
    return [];
  }
};
