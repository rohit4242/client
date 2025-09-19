import { NextRequest, NextResponse } from "next/server";
import db from "@/db";
import { generateAlertMessages, generateTradingViewInstructions } from "@/lib/signal-bot/alert-generator";
import { SignalBot } from "@/types/signal-bot";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "messages"; // messages, instructions, json
    const includeCustomQuantity = searchParams.get("includeCustomQuantity") === "true";
    const includeLeverage = searchParams.get("includeLeverage") === "true";
    const includeOrderType = searchParams.get("includeOrderType") === "true";
    const includeStopLoss = searchParams.get("includeStopLoss") === "true";
    const includeTakeProfit = searchParams.get("includeTakeProfit") === "true";

    // Fetch the bot with all necessary data
    const bot = await db.signalBot.findUnique({
      where: { id: params.id },
      include: {
        takeProfitLevels: true,
      },
    });

    if (!bot) {
      return NextResponse.json(
        { error: "Signal bot not found" },
        { status: 404 }
      );
    }

    // Convert Prisma data to our interface
    const botData = {
      ...bot,
      takeProfitLevels: bot.takeProfitLevels || [],
      dcaOrderSizeMultiplier: bot.dcaOrderSizeMultiplier || 1.0,
      dcaPriceDeviationMultiplier: bot.dcaPriceDeviationMultiplier || 1.0,
    };

    const options = {
      includeCustomQuantity,
      includeLeverage,
      includeOrderType,
      includeStopLoss,
      includeTakeProfit,
    };

    switch (format) {
      case "instructions":
        const instructions = generateTradingViewInstructions(botData);
        return NextResponse.json({
          instructions,
          webhookUrl: `${process.env.NEXTAUTH_URL}/api/webhook/signal-bot`,
        });

      case "json":
        const messages = generateAlertMessages(botData as SignalBot, options);
        return NextResponse.json(messages);

      case "messages":
      default:
        const alertMessages = generateAlertMessages(botData as SignalBot, options);
        return NextResponse.json({
          webhookUrl: alertMessages.webhookUrl,
          messages: {
            enterLong: alertMessages.enterLongMessage,
            exitLong: alertMessages.exitLongMessage,
            enterShort: alertMessages.enterShortMessage,
            exitShort: alertMessages.exitShortMessage,
            exitAll: alertMessages.exitAllMessage,
            ...(alertMessages.customQuantityMessage && {
              customQuantity: alertMessages.customQuantityMessage,
            }),
          },
          ...(alertMessages.jsonExample && {
            pineScriptExample: alertMessages.jsonExample,
          }),
        });
    }
  } catch (error) {
    console.error("Error generating alert messages:", error);
    return NextResponse.json(
      { error: "Failed to generate alert messages" },
      { status: 500 }
    );
  }
}
