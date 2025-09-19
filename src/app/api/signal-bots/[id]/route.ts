import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import db from "@/db";
import { auth } from "@/lib/auth";
import { updateSignalBotSchema } from "@/db/schema/signal-bot";
import { validateBotConfiguration } from "@/lib/signal-bot/signal-validator";
import { SignalBot } from "@/types/signal-bot";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const signalBot = await db.signalBot.findFirst({
      where: {
        id,
        userAccount: {
          userId: session.user.id,
        },
      },
      include: {
        exchange: {
          select: {
            id: true,
            name: true,
            isActive: true,
          },
        },
        signals: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        botTrades: {
          orderBy: { createdAt: "desc" },
          take: 20,
        },
        _count: {
          select: {
            signals: true,
            botTrades: true,
          },
        },
      },
    });

    if (!signalBot) {
      return NextResponse.json(
        { error: "Signal bot not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(signalBot);
  } catch (error) {
    console.error("Error fetching signal bot:", error);
    return NextResponse.json(
      { error: "Failed to fetch signal bot" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedBot = updateSignalBotSchema.safeParse(body);
    
    if (!validatedBot.success) {
      return NextResponse.json(
        {
          error: "Invalid bot data",
          details: validatedBot.error,
        },
        { status: 400 }
      );
    }

    const botData = validatedBot.data;

    // Validate bot configuration if significant changes
    if (botData.portfolioPercent || botData.stopLoss || botData.takeProfitLevels || botData.dcaEnabled) {
      const configValidation = validateBotConfiguration(botData as SignalBot);
      if (!configValidation.isValid) {
        return NextResponse.json(
          { error: configValidation.error },
          { status: 400 }
        );
      }
    }

    // Verify bot exists and belongs to user
    const existingBot = await db.signalBot.findFirst({
      where: {
        id,
        userAccount: {
          userId: session.user.id,
        },
      },
    });

    if (!existingBot) {
      return NextResponse.json(
        { error: "Signal bot not found" },
        { status: 404 }
      );
    }

    // Check for name conflicts if name is being changed
    if (botData.name && botData.name !== existingBot.name) {
      const nameConflict = await db.signalBot.findFirst({
        where: {
          name: botData.name,
          userAccountId: existingBot.userAccountId,
          id: { not: id },
        },
      });

      if (nameConflict) {
        return NextResponse.json(
          { error: "A bot with this name already exists" },
          { status: 400 }
        );
      }
    }

    // Verify exchange if being changed
    if (botData.exchangeId && botData.exchangeId !== existingBot.exchangeId) {
      const exchange = await db.exchange.findFirst({
        where: {
          id: botData.exchangeId,
          userId: session.user.id,
        },
      });

      if (!exchange) {
        return NextResponse.json(
          { error: "Exchange not found or not accessible" },
          { status: 404 }
        );
      }
    }

    // Update signal bot
    const updatedBot = await db.signalBot.update({
      where: { id },
      data: {
        ...(botData as SignalBot),
        updatedAt: new Date(),
      },
      include: {
        exchange: {
          select: {
            id: true,
            name: true,
            isActive: true,
          },
        },
      },
    });

    return NextResponse.json(updatedBot);
  } catch (error) {
    console.error("Error updating signal bot:", error);
    return NextResponse.json(
      { error: "Failed to update signal bot" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify bot exists and belongs to user
    const existingBot = await db.signalBot.findFirst({
      where: {
        id,
        userAccount: {
          userId: session.user.id,
        },
      },
    });

    if (!existingBot) {
      return NextResponse.json(
        { error: "Signal bot not found" },
        { status: 404 }
      );
    }

    // Check if bot has open trades
    const openTrades = await db.botTrade.count({
      where: {
        botId: id,
        status: "Open",
      },
    });

    if (openTrades > 0) {
      return NextResponse.json(
        { 
          error: `Cannot delete bot with ${openTrades} open trade(s). Please close all positions first.`,
        },
        { status: 400 }
      );
    }

    // Delete the signal bot (cascading deletes will handle related records)
    await db.signalBot.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Signal bot deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting signal bot:", error);
    return NextResponse.json(
      { error: "Failed to delete signal bot" },
      { status: 500 }
    );
  }
}

// Toggle bot active status
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    if (action !== "toggle") {
      return NextResponse.json(
        { error: "Invalid action" },
        { status: 400 }
      );
    }

    // Verify bot exists and belongs to user
    const existingBot = await db.signalBot.findFirst({
      where: {
        id,
        userAccount: {
          userId: session.user.id,
        },
      },
    });

    if (!existingBot) {
      return NextResponse.json(
        { error: "Signal bot not found" },
        { status: 404 }
      );
    }

    // Toggle active status
    const updatedBot = await db.signalBot.update({
      where: { id },
      data: {
        isActive: !existingBot.isActive,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      isActive: updatedBot.isActive,
      message: `Bot ${updatedBot.isActive ? "activated" : "deactivated"} successfully`,
    });
  } catch (error) {
    console.error("Error toggling signal bot:", error);
    return NextResponse.json(
      { error: "Failed to toggle signal bot" },
      { status: 500 }
    );
  }
}
