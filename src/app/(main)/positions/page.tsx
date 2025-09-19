import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getOrders } from "@/db/actions/order/get-orders";
import { OrderHistoryTable } from "@/app/(main)/positions/_components/order-history-table";
import { BotTradesTable } from "@/app/(main)/positions/_components/bot-trades-table";
import { LivePositionsTable } from "@/app/(main)/positions/_components/live-positions-table";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, Bot, TrendingUp, Clock } from "lucide-react";
import db from "@/db";

async function getBotTrades(userId: string) {
  try {
    const botTrades = await db.botTrade.findMany({
      where: {
        bot: {
          userAccount: {
            userId: userId,
          },
        },
      },
      include: {
        bot: {
          select: {
            name: true,
            symbols: true,
          },
        },
        signal: {
          select: {
            action: true,
            strategy: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return botTrades;
  } catch (error) {
    console.error("Error fetching bot trades:", error);
    return [];
  }
}

async function getOpenPositions(userId: string) {
  try {
    const openPositions = await db.botTrade.findMany({
      where: {
        bot: {
          userAccount: {
            userId: userId,
          },
        },
        status: 'Open',
      },
      include: {
        bot: {
          select: {
            name: true,
            symbols: true,
            portfolioPercent: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return openPositions;
  } catch (error) {
    console.error("Error fetching open positions:", error);
    return [];
  }
}

async function OrderHistoryContent() {
  try {
    const orders = await getOrders();
    
    if (orders.length === 0) {
      return (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            No orders found. Make sure you have an active exchange connected and have placed some orders.
          </AlertDescription>
        </Alert>
      );
    }
    
    return <OrderHistoryTable orders={orders} />;
  } catch (error) {
    console.error("Error loading orders:", error);
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load order history. Please make sure your exchange is properly connected and try again.
        </AlertDescription>
      </Alert>
    );
  }
}

async function BotTradesContent({ userId }: { userId: string }) {
  try {
    const botTrades = await getBotTrades(userId);
    
    if (botTrades.length === 0) {
      return (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            No bot trades found. Create a Signal Bot and start receiving signals to see trades here.
          </AlertDescription>
        </Alert>
      );
    }
    
    return <BotTradesTable trades={botTrades} />;
  } catch (error) {
    console.error("Error loading bot trades:", error);
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load bot trades. Please try again.
        </AlertDescription>
      </Alert>
    );
  }
}

async function LivePositionsContent({ userId }: { userId: string }) {
  try {
    const openPositions = await getOpenPositions(userId);
    
    if (openPositions.length === 0) {
      return (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            No open positions found. Open positions from your Signal Bots will appear here.
          </AlertDescription>
        </Alert>
      );
    }
    
    return <LivePositionsTable positions={openPositions} />;
  } catch (error) {
    console.error("Error loading open positions:", error);
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load open positions. Please try again.
        </AlertDescription>
      </Alert>
    );
  }
}

function OrderHistoryLoading() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
      <div className="rounded-md border">
        <div className="p-4 space-y-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="flex items-center gap-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default async function PositionsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Positions & Trading</h1>
        <p className="text-muted-foreground">
          Monitor your live positions, bot trades, and manual order history
        </p>
      </div>

      <Tabs defaultValue="positions" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="positions" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Live Positions
          </TabsTrigger>
          <TabsTrigger value="bot-trades" className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            Bot Trades
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Order History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="positions" className="mt-6">
          <Suspense fallback={<OrderHistoryLoading />}>
            <LivePositionsContent userId={session.user.id} />
          </Suspense>
        </TabsContent>

        <TabsContent value="bot-trades" className="mt-6">
          <Suspense fallback={<OrderHistoryLoading />}>
            <BotTradesContent userId={session.user.id} />
          </Suspense>
        </TabsContent>

        <TabsContent value="orders" className="mt-6">
          <Suspense fallback={<OrderHistoryLoading />}>
            <OrderHistoryContent />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
