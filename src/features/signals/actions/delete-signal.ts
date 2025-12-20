"use server";

import db from "@/db";
import { isAdmin } from "@/lib/auth-utils";
import { revalidatePath } from "next/cache";

/**
 * Delete a signal (Admin action)
 */
export async function deleteSignal(signalId: string) {
    try {
        const admin = await isAdmin();
        if (!admin) throw new Error("Unauthorized: Admin access required");

        await db.signal.delete({
            where: { id: signalId },
        });

        revalidatePath("/(admin)/signals", "page");

        return { success: true };
    } catch (error) {
        console.error("Error deleting signal:", error);
        return { success: false, error: "Failed to delete signal" };
    }
}
