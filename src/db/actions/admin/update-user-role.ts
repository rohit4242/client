"use server";

import { isAdmin } from "@/lib/auth-utils";
import db from "@/db";
import { revalidatePath } from "next/cache";

export async function updateUserRole(
  userId: string,
  newRole: "ADMIN" | "AGENT" | "CUSTOMER"
): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = await isAdmin();

    if (!admin) {
      return { success: false, error: "Unauthorized: Admin access required" };
    }

    // Check if user exists
    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Update user role
    await db.user.update({
      where: { id: userId },
      data: { role: newRole },
    });

    // If changing from AGENT to another role, unassign all customers
    if (user.role === "AGENT" && newRole !== "AGENT") {
      await db.user.updateMany({
        where: { agentId: userId },
        data: { agentId: null },
      });
    }

    // If changing from CUSTOMER to another role, unassign from agent
    if (user.role === "CUSTOMER" && newRole !== "CUSTOMER") {
      await db.user.update({
        where: { id: userId },
        data: { agentId: null },
      });
    }

    revalidatePath("/users");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Error updating user role:", error);
    return { success: false, error: "Failed to update user role" };
  }
}

