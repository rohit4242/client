"use server";

import { isAdmin } from "@/lib/auth-utils";
import db from "@/db";

export interface SignalWithBot {
  id: string;
  botId: string;
  botName: string;
  customerName: string;
  customerEmail: string;
  customerId: string;
  action: "ENTER_LONG" | "EXIT_LONG" | "ENTER_SHORT" | "EXIT_SHORT";
  symbol: string;
  price: number | null;
  message: string | null;
  processed: boolean;
  error: string | null;
  visibleToCustomer: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function getAllSignals(): Promise<SignalWithBot[]> {
  try {
    const admin = await isAdmin();

    if (!admin) {
      throw new Error("Unauthorized: Admin access required");
    }

    // Get all signals with bot and user information
    const signals = await db.signal.findMany({
      include: {
        bot: {
          include: {
            portfolio: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return signals.map((signal) => ({
      id: signal.id,
      botId: signal.botId,
      botName: signal.bot.name,
      customerName: signal.bot.portfolio.user.name,
      customerEmail: signal.bot.portfolio.user.email,
      customerId: signal.bot.portfolio.user.id,
      action: signal.action as "ENTER_LONG" | "EXIT_LONG" | "ENTER_SHORT" | "EXIT_SHORT",
      symbol: signal.symbol,
      price: signal.price,
      message: signal.message,
      processed: signal.processed,
      error: signal.error,
      visibleToCustomer: signal.visibleToCustomer,
      createdAt: signal.createdAt.toISOString(),
      updatedAt: signal.updatedAt.toISOString(),
    }));
  } catch (error) {
    console.error("Error fetching all signals:", error);
    return [];
  }
}

export async function updateSignalVisibility(
  signalId: string,
  visibleToCustomer: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = await isAdmin();

    if (!admin) {
      return { success: false, error: "Unauthorized: Admin access required" };
    }

    await db.signal.update({
      where: { id: signalId },
      data: { visibleToCustomer },
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating signal visibility:", error);
    return { success: false, error: "Failed to update signal visibility" };
  }
}

export async function updateSignal(
  signalId: string,
  data: {
    action?: "ENTER_LONG" | "EXIT_LONG" | "ENTER_SHORT" | "EXIT_SHORT";
    symbol?: string;
    price?: number | null;
    message?: string | null;
    processed?: boolean;
    visibleToCustomer?: boolean;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = await isAdmin();

    if (!admin) {
      return { success: false, error: "Unauthorized: Admin access required" };
    }

    await db.signal.update({
      where: { id: signalId },
      data,
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating signal:", error);
    return { success: false, error: "Failed to update signal" };
  }
}

export async function deleteSignal(
  signalId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = await isAdmin();

    if (!admin) {
      return { success: false, error: "Unauthorized: Admin access required" };
    }

    await db.signal.delete({
      where: { id: signalId },
    });

    return { success: true };
  } catch (error) {
    console.error("Error deleting signal:", error);
    return { success: false, error: "Failed to delete signal" };
  }
}

