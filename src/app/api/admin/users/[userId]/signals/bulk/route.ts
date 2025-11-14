import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-utils";
import db from "@/db";
import { z } from "zod";

const signalSchema = z.object({
  botId: z.string().uuid(),
  action: z.enum(["ENTER_LONG", "EXIT_LONG", "ENTER_SHORT", "EXIT_SHORT"]),
  symbol: z.string().min(1),
  price: z.number().positive().nullable().optional(),
  message: z.string().nullable().optional(),
});

const bulkSignalsSchema = z.object({
  signals: z.array(signalSchema).min(1),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const admin = await isAdmin();

    if (!admin) {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required" },
        { status: 403 }
      );
    }

    const { userId } = await params;

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const body = await request.json();

    // Validate input
    const validatedData = bulkSignalsSchema.safeParse(body);
    if (!validatedData.success) {
      return NextResponse.json(
        {
          error: `Invalid input: ${validatedData.error.issues.map((e) => e.message).join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Get user's portfolio
    const portfolio = await db.portfolio.findFirst({
      where: { userId },
    });

    if (!portfolio) {
      return NextResponse.json(
        { error: "User portfolio not found" },
        { status: 404 }
      );
    }

    const signals = validatedData.data.signals;
    let created = 0;
    let failed = 0;
    const errors: Array<{ row: number; error: string }> = [];

    // Process each signal
    for (let i = 0; i < signals.length; i++) {
      const signal = signals[i];
      const rowNumber = i + 1;

      try {
        // Verify bot belongs to this user's portfolio
        const bot = await db.bot.findFirst({
          where: {
            id: signal.botId,
            portfolioId: portfolio.id,
          },
        });

        if (!bot) {
          failed++;
          errors.push({
            row: rowNumber,
            error: "Bot not found or does not belong to this user",
          });
          continue;
        }

        // Create the signal
        await db.signal.create({
          data: {
            botId: signal.botId,
            action: signal.action,
            symbol: signal.symbol,
            price: signal.price ?? null,
            message: signal.message ?? null,
            processed: false,
            visibleToCustomer: true,
          },
        });

        created++;
      } catch (error) {
        failed++;
        errors.push({
          row: rowNumber,
          error: error instanceof Error ? error.message : "Failed to create signal",
        });
        console.error(`Error creating signal for row ${rowNumber}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      created,
      failed,
      errors,
    });
  } catch (error) {
    console.error("Error in POST /api/admin/users/[userId]/signals/bulk:", error);
    return NextResponse.json(
      { error: "Failed to process bulk signals" },
      { status: 500 }
    );
  }
}

