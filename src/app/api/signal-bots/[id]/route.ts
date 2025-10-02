import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import db from "@/db";
import { updateSignalBotSchema } from "@/db/schema/signal-bot";
import { getSelectedUser } from "@/lib/selected-user-server";

// GET /api/signal-bots/[id] - Get specific signal bot
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if admin is using selected user
    const selectedUser = await getSelectedUser();
    const targetUserId = selectedUser?.id || session.user.id;

    const portfolio = await db.portfolio.findFirst({
      where: { userId: targetUserId },
    });

    if (!portfolio) {
      return NextResponse.json({ error: "User account not found" }, { status: 404 });
    }

    const signalBot = await db.bot.findFirst({
      where: {
        id,
        portfolioId: portfolio.id,
      },
      include: {
        exchange: {
          select: {
            id: true,
            name: true,
            isActive: true,
            totalValue: true,
          },
        },
        _count: {
          select: {
            signals: true,
            positions: true,
          },
        },
      },
    });

    if (!signalBot) {
      return NextResponse.json({ error: "Signal bot not found" }, { status: 404 });
    }

    // Generate webhook URL
    const webhookUrl = `${process.env.NEXTAUTH_URL}/api/webhook/signal-bot`;

    // Transform to match SignalBot interface
    const response = {
      id: signalBot.id,
      name: signalBot.name,
      description: signalBot.description,
      portfolioId: signalBot.portfolioId,
      exchangeId: signalBot.exchangeId,
      symbols: signalBot.symbols,
      isActive: signalBot.isActive,
      orderType: signalBot.orderType as "Market" | "Limit" | "Stop",
      portfolioPercent: signalBot.positionPercent,
      leverage: signalBot.leverage,
      stopLoss: signalBot.stopLoss,
      takeProfit: signalBot.takeProfit,
      webhookUrl,
      webhookSecret: signalBot.webhookSecret,
      enterLongMsg: signalBot.enterLongMsg,
      exitLongMsg: signalBot.exitLongMsg,
      enterShortMsg: signalBot.enterShortMsg,
      exitShortMsg: signalBot.exitShortMsg,
      totalTrades: signalBot.totalTrades,
      winningTrades: signalBot.winTrades,
      totalPnl: signalBot.totalPnl,
      exchange: signalBot.exchange,
      createdAt: signalBot.createdAt,
      updatedAt: signalBot.updatedAt,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching signal bot:", error);
    return NextResponse.json(
      { error: "Failed to fetch signal bot" },
      { status: 500 }
    );
  }
}

// PUT /api/signal-bots/[id] - Update signal bot
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if admin is using selected user
    const selectedUser = await getSelectedUser();
    const targetUserId = selectedUser?.id || session.user.id;

    const portfolio = await db.portfolio.findFirst({
      where: { userId: targetUserId },
    });

    if (!portfolio) {
      return NextResponse.json({ error: "User account not found" }, { status: 404 });
    }

    const body = await request.json();
    
    // Validate request body
    const validatedData = updateSignalBotSchema.safeParse(body);
    if (!validatedData.success) {
      return NextResponse.json(
        { 
          error: "Invalid request data", 
          details: validatedData.error.issues 
        },
        { status: 400 }
      );
    }

    const data = validatedData.data;

    // Check if bot exists and belongs to user
    const existingBot = await db.bot.findFirst({
      where: {
        id,
        portfolioId: portfolio.id,
      },
    });

    if (!existingBot) {
      return NextResponse.json({ error: "Signal bot not found" }, { status: 404 });
    }

    // If exchangeId is being updated, verify the new exchange
    if (data.exchangeId && data.exchangeId !== existingBot.exchangeId) {
      const exchange = await db.exchange.findFirst({
        where: {
          id: data.exchangeId,
          portfolioId: portfolio.id,
          isActive: true,
        },
      });

      if (!exchange) {
        return NextResponse.json(
          { error: "Exchange not found or not active" },
          { status: 404 }
        );
      }
    }

    // Update signal bot
    const updatedBot = await db.bot.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.exchangeId && { exchangeId: data.exchangeId }),
        ...(data.symbols && { symbols: data.symbols }),
        ...(data.orderType && { orderType: data.orderType }),
        ...(data.portfolioPercent && { positionPercent: data.portfolioPercent }),
        ...(data.leverage !== undefined && { leverage: data.leverage }),
        ...(data.stopLoss !== undefined && { stopLoss: data.stopLoss }),
        ...(data.takeProfit !== undefined && { takeProfit: data.takeProfit }),
        ...(data.enterLongMsg !== undefined && { enterLongMsg: data.enterLongMsg }),
        ...(data.exitLongMsg !== undefined && { exitLongMsg: data.exitLongMsg }),
        ...(data.enterShortMsg !== undefined && { enterShortMsg: data.enterShortMsg }),
        ...(data.exitShortMsg !== undefined && { exitShortMsg: data.exitShortMsg }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
      include: {
        exchange: {
          select: {
            id: true,
            name: true,
            isActive: true,
            totalValue: true,
          },
        },
      },
    });

    // Generate webhook URL
    const webhookUrl = `${process.env.NEXTAUTH_URL}/api/webhook/signal-bot`;

    // Transform response to match SignalBot interface
    const response = {
      id: updatedBot.id,
      name: updatedBot.name,
      description: updatedBot.description,
        portfolioId: updatedBot.portfolioId,
      exchangeId: updatedBot.exchangeId,
      symbols: updatedBot.symbols,
      isActive: updatedBot.isActive,
      orderType: updatedBot.orderType as "Market" | "Limit" | "Stop",
      portfolioPercent: updatedBot.positionPercent,
      leverage: updatedBot.leverage,
      stopLoss: updatedBot.stopLoss,
      takeProfit: updatedBot.takeProfit,
      webhookUrl,
      webhookSecret: updatedBot.webhookSecret,
      enterLongMsg: updatedBot.enterLongMsg,
      exitLongMsg: updatedBot.exitLongMsg,
      enterShortMsg: updatedBot.enterShortMsg,
      exitShortMsg: updatedBot.exitShortMsg,
      totalTrades: updatedBot.totalTrades,
      winningTrades: updatedBot.winTrades,
      totalPnl: updatedBot.totalPnl,
      exchange: updatedBot.exchange,
      createdAt: updatedBot.createdAt,
      updatedAt: updatedBot.updatedAt,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error updating signal bot:", error);
    return NextResponse.json(
      { error: "Failed to update signal bot" },
      { status: 500 }
    );
  }
}

// DELETE /api/signal-bots/[id] - Delete signal bot
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if admin is using selected user
    const selectedUser = await getSelectedUser();
    const targetUserId = selectedUser?.id || session.user.id;

    const portfolio = await db.portfolio.findFirst({
      where: { userId: targetUserId },
    });

    if (!portfolio) {
      return NextResponse.json({ error: "User account not found" }, { status: 404 });
    }

    // Check if bot exists and belongs to user
    const existingBot = await db.bot.findFirst({
      where: {
        id,
        portfolioId: portfolio.id,
      },
    });

    if (!existingBot) {
      return NextResponse.json({ error: "Signal bot not found" }, { status: 404 });
    }

    // Check if bot has any open positions
    const openPositions = await db.position.findMany({
      where: {
        botId: id,
        status: "OPEN",
      },
    });

    if (openPositions.length > 0) {
      return NextResponse.json(
        { 
          error: "Cannot delete bot with open positions. Please close all positions first.",
          openPositions: openPositions.length 
        },
        { status: 400 }
      );
    }

    // Delete the bot (signals will be cascade deleted)
    await db.bot.delete({
      where: { id },
    });

    return NextResponse.json({ 
      success: true, 
      message: "Signal bot deleted successfully" 
    });
  } catch (error) {
    console.error("Error deleting signal bot:", error);
    return NextResponse.json(
      { error: "Failed to delete signal bot" },
      { status: 500 }
    );
  }
}
