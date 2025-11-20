import db from "@/db";
import { Action } from "@prisma/client";
import {
  executeEnterLong,
  executeExitLong,
  executeEnterShort,
  executeExitShort,
  type TradeExecutionResult
} from "./trade-executor";
import { recalculatePortfolioStatsInternal } from "@/db/actions/portfolio/recalculate-stats";

/**
 * Signal processing result interface
 */
export interface SignalProcessingResult {
  success: boolean;
  positionId?: string;
  orderId?: string;
  message?: string;
  error?: string;
  skipped?: boolean;
  skipReason?: string;
}

/**
 * Process a signal and execute the corresponding trade
 * 
 * @param signalId - The ID of the signal to process
 * @returns Promise<SignalProcessingResult>
 */
export async function processSignal(signalId: string): Promise<SignalProcessingResult> {
  console.log(`Processing signal: ${signalId}`);

  try {
    // Fetch the signal with all necessary relations
    const signal = await db.signal.findUnique({
      where: { id: signalId },
      include: {
        bot: {
          include: {
            exchange: true,
            portfolio: true,
          },
        },
      },
    });

    if (!signal) {
      throw new Error("Signal not found");
    }

    if (signal.processed) {
      return {
        success: false,
        skipped: true,
        skipReason: "Signal already processed",
      };
    }

    const { bot, action, symbol, price } = signal;

    if (!bot) {
      throw new Error("Bot not found for signal");
    }

    if (!bot.isActive) {
      await db.signal.update({
        where: { id: signalId },
        data: {
          processed: true,
          error: "Bot is not active",
        },
      });

      return {
        success: false,
        skipped: true,
        skipReason: "Bot is not active",
      };
    }

    // Get current price if not provided in signal
    let currentPrice = price;
    if (!currentPrice) {
      const { getPriceBySymbol } = await import("@/lib/trading-utils");
      const configurationRestAPI = {
        apiKey: bot.exchange.apiKey,
        apiSecret: bot.exchange.apiSecret,
      };
      const priceData = await getPriceBySymbol(configurationRestAPI, symbol);
      
      if (typeof priceData === 'object' && 'price' in priceData) {
        currentPrice = parseFloat(priceData.price as string);
      } else if (typeof priceData === 'string') {
        currentPrice = parseFloat(priceData);
      } else if (typeof priceData === 'number') {
        currentPrice = priceData;
      }
    }

    if (!currentPrice || currentPrice <= 0) {
      throw new Error("Unable to get valid current price");
    }

    console.log(`Executing ${action} for ${symbol} at price ${currentPrice}`);

    // Execute the trade based on action
    let result: TradeExecutionResult;

    switch (action) {
      case Action.ENTER_LONG:
        result = await executeEnterLong({
          bot,
          signal,
          currentPrice,
        });
        break;

      case Action.EXIT_LONG:
        result = await executeExitLong({
          bot,
          signal,
          currentPrice,
        });
        break;

      case Action.ENTER_SHORT:
        result = await executeEnterShort({
          bot,
          signal,
          currentPrice,
        });
        break;

      case Action.EXIT_SHORT:
        result = await executeExitShort({
          bot,
          signal,
          currentPrice,
        });
        break;

      default:
        throw new Error(`Unsupported action: ${action}`);
    }

    // Mark signal as processed
    await db.signal.update({
      where: { id: signalId },
      data: {
        processed: true,
        error: result.success ? null : result.error,
      },
    });

    if (result.success) {
      console.log(`Signal ${signalId} processed successfully`);
      
      // Recalculate portfolio stats after signal processing
      try {
        const userId = bot.portfolio.userId;
        await recalculatePortfolioStatsInternal(userId);
        console.log(`Portfolio stats recalculated for user ${userId}`);
      } catch (statsError) {
        console.error("Error recalculating portfolio stats:", statsError);
        // Don't fail the signal processing if stats calculation fails
      }
      
      return {
        success: true,
        positionId: result.positionId,
        orderId: result.orderId,
        message: result.message,
      };
    } else {
      console.error(`Signal ${signalId} processing failed:`, result.error);
      return {
        success: false,
        error: result.error,
        skipped: result.skipped,
        skipReason: result.skipReason,
      };
    }

  } catch (error) {
    console.error("Error processing signal:", error);

    // Update signal with error
    await db.signal.update({
      where: { id: signalId },
      data: {
        processed: true,
        error: error instanceof Error ? error.message : "Unknown error",
      },
    }).catch(err => console.error("Failed to update signal error:", err));

    throw error;
  }
}