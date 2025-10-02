import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import db from "@/db";
import { PositionStatus, PositionData, PositionOrder } from "@/types/position";
import {
  Status,
  Side,
  OrderStatus,
  OrderSide,
  OrderType,
} from "@prisma/client";

export async function getPositions(filters?: {
  status?: PositionStatus;
  symbol?: string;
  exchange?: string;
  limit?: number;
  userId?: string;
}): Promise<PositionData[]> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return [];
  }

  try {
    // Get positions from the database
    const positions = await db.position.findMany({
      where: {
        portfolio: {
          userId: filters?.userId || session.user.id,
        },
        ...(filters?.status && {
          status: mapPositionStatusToDatabase(filters.status),
        }),
        ...(filters?.symbol && { symbol: filters.symbol }),
      },
      include: {
        portfolio: {
          include: {
            exchanges: true,
          },
        },
        orders: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      ...(filters?.limit && { take: filters.limit }),
    });

    // Transform database positions to PositionData format
    return positions.map(transformDatabasePositionToPositionData);
  } catch (error) {
    console.error("Error fetching positions:", error);
    return [];
  }
}

// Get raw database positions (for internal use)
export async function getRawPositions(filters?: {
  status?: PositionStatus;
  symbol?: string;
  exchange?: string;
  limit?: number;
  userId?: string;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return [];
  }

  try {
    const positions = await db.position.findMany({
      where: {
        portfolio: {
          userId: filters?.userId || session.user.id,
        },
        ...(filters?.status && {
          status: mapPositionStatusToDatabase(filters.status),
        }),
        ...(filters?.symbol && { symbol: filters.symbol }),
      },
      include: {
        portfolio: {
          include: {
            exchanges: true,
          },
        },
        orders: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      ...(filters?.limit && { take: filters.limit }),
    });

    return positions;
  } catch (error) {
    console.error("Error fetching raw positions:", error);
    return [];
  }
}

function mapPositionStatusToDatabase(status: PositionStatus): Status {
  switch (status) {
    case "OPEN":
      return Status.OPEN;
    case "CLOSED":
      return Status.CLOSED;
    case "CANCELED":
      return Status.CANCELED;
    case "MARKET_CLOSED":
      return Status.MARKET_CLOSED;
    case "FAILED":
      return Status.FAILED;
    default:
      return Status.OPEN;
  }
}

function mapDatabaseStatusToPositionStatus(dbStatus: Status): PositionStatus {
  switch (dbStatus) {
    case Status.OPEN:
      return "OPEN";
    case Status.CLOSED:
      return "CLOSED";
    case Status.CANCELED:
      return "CANCELED";
    case Status.MARKET_CLOSED:
      return "MARKET_CLOSED";
    case Status.FAILED:
      return "FAILED";

    default:
      return "OPEN";
  }
}

// Database order type
interface DatabaseOrder {
  id: string;
  type: OrderType;
  side: OrderSide;
  price: number;
  quantity: number;
  fillPercent: number;
  value: number;
  pnl: number;
  updatedAt: Date;
  status: OrderStatus;
}

// Database position type (matches Prisma schema)
interface DatabasePosition {
  id: string;
  symbol: string;
  side: Side;
  entryPrice: number;
  quantity: number;
  entryValue: number;
  currentPrice: number | null;
  status: Status;
  exitPrice: number | null;
  exitValue: number | null;
  pnl: number;
  pnlPercent: number;
  takeProfit: number | null;
  stopLoss: number | null;
  source: "MANUAL" | "BOT";
  strategyId: string | null;
  portfolioId: string;
  createdAt: Date;
  updatedAt: Date;
  portfolio: {
    exchanges: Array<{
      name: string;
      id: string;
      portfolioId: string;
      createdAt: Date;
      updatedAt: Date;
      apiKey: string;
      apiSecret: string;
      isActive: boolean;
      positionMode: "One_Way" | "Hedge";
      totalValue: string;
      lastSyncedAt: Date;
    }>;
  };
  orders: DatabaseOrder[];
}

// Transform database order to PositionOrder format
function transformDatabaseOrderToPositionOrder(
  order: DatabaseOrder
): PositionOrder {
  return {
    id: order.id,
    type: order.type,
    side: order.side,
    price: order.price,
    amount: order.quantity,
    filled: (order.quantity * order.fillPercent) / 100,
    remaining: order.quantity - (order.quantity * order.fillPercent) / 100,
    createdAt: order.updatedAt,
    lastUpdatedAt: order.updatedAt,
    status:
      order.status === OrderStatus.FILLED
        ? "COMPLETED"
        : order.status === OrderStatus.CANCELED
        ? "CANCELED"
        : order.status === OrderStatus.PARTIALLY_FILLED
        ? "PARTIALLY_FILLED"
        : order.status === OrderStatus.REJECTED
        ? "REJECTED"
        : order.status === OrderStatus.PENDING
        ? "NEW"
        : "NEW",
    fill: order.fillPercent,
    volume: order.value,
    pnl: order.pnl,
    fees: 0,
  };
}

// Transform database position to PositionData format
function transformDatabasePositionToPositionData(
  position: DatabasePosition
): PositionData {
  // Calculate current values
  const isClosedPosition =
    position.status === Status.CLOSED ||
    position.status === Status.MARKET_CLOSED;
  const currentPrice = isClosedPosition
    ? position.exitPrice ?? position.entryPrice
    : position.currentPrice ?? position.entryPrice;

  // For closed positions, use actual PnL from database, for open positions calculate unrealized PnL
  const unrealizedPnl = isClosedPosition
    ? 0
    : (currentPrice - position.entryPrice) * position.quantity;
  const realizedPnl = isClosedPosition ? position.pnl : 0;
  const totalPnl = isClosedPosition ? position.pnl : unrealizedPnl;
  const pnlPercent =
    position.entryPrice > 0
      ? (totalPnl / (position.entryPrice * position.quantity)) * 100
      : 0;

  // Transform orders
  const transformedOrders =
    position.orders?.map(transformDatabaseOrderToPositionOrder) || [];

  return {
    id: position.id,
    symbol: position.symbol,
    side: position.side === Side.LONG ? "Long" : "Short",
    entryPrice: position.entryPrice,
    currentPrice: currentPrice,
    exitPrice: position.exitPrice ?? undefined,
    quantity: position.quantity,
    filledQuantity: position.quantity,
    remainingQuantity: 0,
    maxDrawdown: 0, // Calculate if needed
    takeProfit: position.takeProfit ?? undefined,
    stopLoss: position.stopLoss ?? undefined,
    breakEven: undefined,
    trailing: undefined,
    portfolioPercent: 0, // Calculate based on total portfolio
    pnlPercent: pnlPercent,
    roiPercent: pnlPercent,
    unrealizedPnl: unrealizedPnl,
    realizedPnl: realizedPnl,
    status: mapDatabaseStatusToPositionStatus(position.status),
    entryTime: position.createdAt,
    exitTime:
      position.status === Status.CLOSED ? position.updatedAt : undefined,
    lastUpdated: position.updatedAt,
    exchange: position.portfolio?.exchanges?.[0]?.name || "UNKNOWN",
    strategy: {
      id: position.strategyId ?? position.id,
      name: position.source === "BOT" ? "Signal Bot" : "Manual",
      description:
        position.source === "BOT"
          ? "Automated trading strategy"
          : "Manual trade",
    },
    account: {
      id: position.portfolioId,
      name: position.portfolio?.exchanges?.[0]?.name || "Unknown Account",
      exchange: position.portfolio?.exchanges?.[0]
        ? {
            id: position.portfolio.exchanges[0].id,
            portfolioId: position.portfolioId,
            name: position.portfolio.exchanges[0].name,
            apiKey: position.portfolio.exchanges[0].apiKey,
            apiSecret: position.portfolio.exchanges[0].apiSecret,
            isActive: position.portfolio.exchanges[0].isActive,
            positionMode: position.portfolio.exchanges[0].positionMode,
            totalValue:
              parseFloat(position.portfolio.exchanges[0].totalValue) || 0,
            lastSyncedAt:
              position.portfolio.exchanges[0].lastSyncedAt.toISOString(),
            createdAt: position.portfolio.exchanges[0].createdAt.toISOString(),
            updatedAt: position.portfolio.exchanges[0].updatedAt.toISOString(),
          }
        : {
            id: "",
            portfolioId: position.portfolioId,
            name: "UNKNOWN",
            apiKey: "",
            apiSecret: "",
            isActive: false,
            positionMode: "One_Way" as const,
            totalValue: 0,
            lastSyncedAt: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
      accountType: "SPOT",
    },
    orders: transformedOrders,
    totalVolume: position.entryValue,
    profitLoss: totalPnl,
    fees: 0, // Calculate if needed
    tags: position.source === "BOT" ? ["automated", "signal-bot"] : ["manual"],
    riskLevel: "MEDIUM",
  };
}

export async function getOpenPositions(userId?: string): Promise<PositionData[]> {
  return getPositions({ status: "OPEN", userId });
}

export async function getClosedPositions(userId?: string): Promise<PositionData[]> {
  return getPositions({ status: "CLOSED", userId });
}

// Get positions for bot trades (filtered by source)
export async function getBotPositions(userId?: string): Promise<PositionData[]> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return [];
  }

  try {
    const positions = await db.position.findMany({
      where: {
        portfolio: {
          userId: userId || session.user.id,
        },
        source: "BOT",
      },
      include: {
        portfolio: {
          include: {
            exchanges: true,
          },
        },
        orders: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return positions.map(transformDatabasePositionToPositionData);
  } catch (error) {
    console.error("Error fetching bot positions:", error);
    return [];
  }
}

// Get positions for manual trades (filtered by source)
export async function getManualPositions(userId?: string): Promise<PositionData[]> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return [];
  }

  try {
    const positions = await db.position.findMany({
      where: {
        portfolio: {
          userId: userId || session.user.id,
        },
        source: "MANUAL",
      },
      include: {
        portfolio: {
          include: {
            exchanges: true,
          },
        },
        orders: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return positions.map(transformDatabasePositionToPositionData);
  } catch (error) {
    console.error("Error fetching manual positions:", error);
    return [];
  }
}
