"use server";

import { isAdmin } from "@/lib/auth-utils";
import db from "@/db";
import { revalidatePath } from "next/cache";

export async function assignCustomerToAgent(
  customerId: string,
  agentId: string | null
): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = await isAdmin();

    if (!admin) {
      return { success: false, error: "Unauthorized: Admin access required" };
    }

    // Check if customer exists and has CUSTOMER role
    const customer = await db.user.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      return { success: false, error: "Customer not found" };
    }

    if (customer.role !== "CUSTOMER") {
      return { success: false, error: "User is not a customer" };
    }

    // If agentId is provided, verify agent exists and has AGENT role
    if (agentId) {
      const agent = await db.user.findUnique({
        where: { id: agentId },
      });

      if (!agent) {
        return { success: false, error: "Agent not found" };
      }

    }

    // Update customer's agentId
    await db.user.update({
      where: { id: customerId },
      data: { agentId: agentId },
    });

    revalidatePath("/users");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Error assigning customer to agent:", error);
    return { success: false, error: "Failed to assign customer to agent" };
  }
}

