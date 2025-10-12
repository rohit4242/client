import { getUserWithRole } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import { getOrders } from "@/db/actions/customer/get-orders";
import { OrdersTable } from "./_components/orders-table";

export default async function CustomerOrdersPage() {
  const user = await getUserWithRole();

  if (!user) {
    redirect("/sign-in");
  }

  const orders = await getOrders(100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Your Orders</h1>
        <p className="text-muted-foreground">
          View your order history and execution details.
        </p>
      </div>

      <OrdersTable orders={orders} />
    </div>
  );
}

