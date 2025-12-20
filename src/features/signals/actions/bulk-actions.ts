"use server";

import db from "@/db";
import { isAdmin } from "@/lib/auth-utils";
import { revalidatePath } from "next/cache";

/**
 * Bulk update signal visibility (Admin action)
 */
export async function bulkUpdateVisibility(signalIds: string[], visibleToCustomer: boolean) {
    try {
        const admin = await isAdmin();
        if (!admin) throw new Error("Unauthorized: Admin access required");

        await db.signal.updateMany({
            where: { id: { in: signalIds } },
            data: { visibleToCustomer },
        });

        revalidatePath("/(admin)/signals", "page");

        return { success: true };
    } catch (error) {
        console.error("Error bulk updating visibility:", error);
        return { success: false, error: "Failed to update signals visibility" };
    }
}

/**
 * Bulk update signal processed status (Admin action)
 */
export async function bulkUpdateProcessedStatus(signalIds: string[], processed: boolean) {
    try {
        const admin = await isAdmin();
        if (!admin) throw new Error("Unauthorized: Admin access required");

        await db.signal.updateMany({
            where: { id: { in: signalIds } },
            data: { processed },
        });

        revalidatePath("/(admin)/signals", "page");

        return { success: true };
    } catch (error) {
        console.error("Error bulk updating processed status:", error);
        return { success: false, error: "Failed to update signals status" };
    }
}
