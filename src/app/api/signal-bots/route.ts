import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import db from "@/db";
import { auth } from "@/lib/auth";
import { createSignalBotSchema } from "@/db/schema/signal-bot";
import { validateBotConfiguration } from "@/lib/signal-bot/signal-validator";
import { generateWebhookSecret } from "@/lib/utils";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const signalBots = await db.signalBot.findMany({
      where: {
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
        _count: {
          select: {
            signals: true,
            botTrades: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(signalBots);
  } catch (error) {
    console.error("Error fetching signal bots:", error);
    return NextResponse.json(
      { error: "Failed to fetch signal bots" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedBot = createSignalBotSchema.safeParse(body);
    
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

    // Validate bot configuration
    const configValidation = validateBotConfiguration(botData);
    if (!configValidation.isValid) {
      return NextResponse.json(
        { error: configValidation.error },
        { status: 400 }
      );
    }

    // Get user account
    const userAccount = await db.userAccount.findFirst({
      where: { userId: session.user.id },
    });

    if (!userAccount) {
      return NextResponse.json(
        { error: "User account not found" },
        { status: 404 }
      );
    }

    // Verify exchange exists and belongs to user
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

    // Check for duplicate bot names
    const existingBot = await db.signalBot.findFirst({
      where: {
        name: botData.name,
        userAccountId: userAccount.id,
      },
    });

    if (existingBot) {
      return NextResponse.json(
        { error: "A bot with this name already exists" },
        { status: 400 }
      );
    }

    // Generate webhook secret
    const webhookSecret = generateWebhookSecret();
    const webhookUrl = `${process.env.NEXTAUTH_URL}/api/webhook/signal-bot`;

    // Create signal bot
    const signalBot = await db.signalBot.create({
      data: {
        ...botData,
        userAccountId: userAccount.id,
        webhookSecret,
        webhookUrl,
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

    return NextResponse.json(signalBot, { status: 201 });
  } catch (error) {
    console.error("Error creating signal bot:", error);
    return NextResponse.json(
      { error: "Failed to create signal bot" },
      { status: 500 }
    );
  }
}
