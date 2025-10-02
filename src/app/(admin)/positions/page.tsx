import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getPositions } from "@/db/actions/position/get-positions";
import { AdvancedPositionsTable } from "@/app/(admin)/positions/_components/advanced-positions-table";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle} from "lucide-react";
import { getSelectedUser } from "@/lib/selected-user-server";

// Transform bot positions to the format expected by BotTradesTable
// function transformBotPositionsToBotTrades(positions: PositionData[]) {
//   return positions.map(position => ({
//     id: position.id,
//     symbol: position.symbol,
//     side: position.side === "Long" ? "LONG" : "SHORT",
//     entryPrice: position.entryPrice,
//     quantity: position.quantity,
//     entryTime: position.entryTime,
//     createdAt: position.entryTime,
//     status: position.status,
//     tradeType: position.strategy.name === "Signal Bot" ? "BOT" : "MANUAL",
//     exitPrice: position.exitTime ? position.currentPrice : null,
//     profit: position.unrealizedPnl,
//     profitPercentage: position.pnlPercent,
//     bot: {
//       name: position.strategy.name,
//       portfolioPercent: position.portfolioPercent
//     }
//   }));
// }


// async function OrderHistoryContent() {
//   try {
//     const orders = await getOrders();
    
//     if (orders.length === 0) {
//       return (
//         <Alert>
//           <AlertTriangle className="h-4 w-4" />
//           <AlertDescription>
//             No orders found. Make sure you have an active exchange connected and have placed some orders.
//           </AlertDescription>
//         </Alert>
//       );
//     }
    
//     return <OrderHistoryTable orders={orders} />;
//   } catch (error) {
//     console.error("Error loading orders:", error);
//     return (
//       <Alert variant="destructive">
//         <AlertTriangle className="h-4 w-4" />
//         <AlertDescription>
//           Failed to load order history. Please make sure your exchange is properly connected and try again.
//         </AlertDescription>
//       </Alert>
//     );
//   }
// }

// async function BotTradesContent() {
//   try {
//     const botPositions = await getBotPositions();
    
//     if (botPositions.length === 0) {
//       return (
//         <Alert>
//           <AlertTriangle className="h-4 w-4" />
//           <AlertDescription>
//             No bot trades found. Create a Signal Bot and start receiving signals to see trades here.
//           </AlertDescription>
//         </Alert>
//       );
//     }
    
//     const botTrades = transformBotPositionsToBotTrades(botPositions);
//     return <BotTradesTable trades={botTrades} />;
//   } catch (error) {
//     console.error("Error loading bot trades:", error);
//     return (
//       <Alert variant="destructive">
//         <AlertTriangle className="h-4 w-4" />
//         <AlertDescription>
//           Failed to load bot trades. Please try again.
//         </AlertDescription>
//       </Alert>
//     );
//   }
// }


async function RealPositionsContent() {

   const selectedUser = await getSelectedUser();

   console.log("selectedUser", selectedUser);

  try {
    const positions = await getPositions({ userId: selectedUser?.id });
    
    if (positions.length === 0) {
      return (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            No positions found. Create some positions by placing orders to see them here.
          </AlertDescription>
        </Alert>
      );
    }
    
    return <AdvancedPositionsTable positions={positions} />;
  } catch (error) {
    console.error("Error loading positions:", error);
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load positions. Please try again.
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

      {/* Real Positions Table - matches the UI from screenshots */}
      <Suspense fallback={<OrderHistoryLoading />}>
        <RealPositionsContent />
      </Suspense>

      {/* Additional Views */}
      {/* <div className="mt-12 pt-8 border-t">
        <h2 className="text-xl font-semibold mb-4">Additional Views</h2>
        <Tabs defaultValue="bot-trades" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="bot-trades" className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              Bot Trades
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Order History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bot-trades" className="mt-6">
            <Suspense fallback={<OrderHistoryLoading />}>
              <BotTradesContent />
            </Suspense>
          </TabsContent>

          <TabsContent value="orders" className="mt-6">
            <Suspense fallback={<OrderHistoryLoading />}>
              <OrderHistoryContent />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div> */}
    </div>
  );
}
