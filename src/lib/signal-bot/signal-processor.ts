import db from "@/db";
import { Action, Bot, Exchange, Portfolio, Signal } from "@prisma/client";
import {
  fastEnterLong,
  fastExitLong,
  fastEnterShort,
  fastExitShort,
  type FastExecutionResult,
  type FastExecutionContext,
} from "./fast-executor";
import { getPriceBySymbol } from "../trading-utils";
import { signalValidator } from "./signal-validator";
/**
 * Signal processing result interface
 */
export interface SignalProcessingResult {
  success: boolean;
  positionId?: string;
  orderId?: string;
  binanceOrderId?: string;
  message?: string;
  error?: string;
  skipped?: boolean;
  skipReason?: string;
  executionTime?: number;
}

/**
 * Process a signal and execute the corresponding trade
 *
 * OPTIMIZED FLOW:
 * 1. Quick validation
 * 2. Execute on Binance FIRST (speed critical)
 * 3. Create DB records after success
 * 4. Update stats async (non-blocking)
 *
 * @param signalId - The ID of the signal to process
 * @returns Promise<SignalProcessingResult>
 */

export interface ProcessSignalParams {
  signal: Signal;
  bot: Bot;
  exchange: Exchange;
  portfolio: Portfolio;
}

export async function processSignal(
  params: ProcessSignalParams
) {
  const startTime = Date.now();
  console.log(`[Processor] Processing signal: ${params.signal.id}`);

  try {
    // Fetch signal with minimal required relations for speed
    const signal = params.signal;
    const bot = params.bot;
    const exchange = params.exchange;
    const portfolio = params.portfolio;
    const { action, symbol, price } = signal;

    if (!signal) {
      throw new Error("Signal not found");
    }

    if (signal.processed) {
      return {
        success: false,
        skipped: true,
        skipReason: "Signal already processed",
        executionTime: Date.now() - startTime,
      };
    }

    if (!bot) {
      throw new Error("Bot not found for signal");
    }

    if (!bot.isActive) {
      await db.signal.update({
        where: { id: signal.id },
        data: { processed: true, error: "Bot is not active" },
      });
      return {
        success: false,
        skipped: true,
        skipReason: "Bot is not active",
        executionTime: Date.now() - startTime,
      };
    }

    if (!exchange.isActive) {
      await db.signal.update({
        where: { id: signal.id },
        data: { processed: true, error: "Exchange is not active" },
      });
      return {
        success: false,
        skipped: true,
        skipReason: "Exchange is not active",
        executionTime: Date.now() - startTime,
      };
    }

    const signalValidatorResult = await signalValidator(bot, signal, exchange, portfolio);
    if (!signalValidatorResult.validated) {
      return {
        success: false,
        error: signalValidatorResult.errors?.join(", ") || "Unknown error",
      };
    }

    

    // Execute trade using FAST executor (Binance first)
    let result: FastExecutionResult;

    // switch (action) {
    //   case Action.ENTER_LONG:
    //     result = await fastEnterLong(context);
    //     break;

    //   case Action.EXIT_LONG:
    //     result = await fastExitLong(context);
    //     break;

    //   case Action.ENTER_SHORT:
    //     result = await fastEnterShort(context);
    //     break;

    //   case Action.EXIT_SHORT:
    //     result = await fastExitShort(context);
    //     break;

    //   default:
    //     throw new Error(`Unsupported action: ${action}`);
    // }

    // // Mark signal as processed
    // await db.signal.update({
    //   where: { id: signal.id },
    //   data: {
    //     processed: true,
    //     error: result.success ? null : result.error,
    //   },
    // });

    // const totalTime = Date.now() - startTime;

    // if (result.success) {
    //   console.log(
    //     `[Processor] Signal ${signal.id} completed in ${totalTime}ms`
    //   );
    //   return {
    //     success: true,
    //     positionId: result.positionId,
    //     orderId: result.orderId,
    //     binanceOrderId: result.binanceOrderId,
    //     message: result.message,
    //     executionTime: totalTime,
    //   };
    // } else {
    //   console.error(`[Processor] Signal ${signal.id} failed:`, result.error);
    //   return {
    //     success: false,
    //     error: result.error,
    //     skipped: result.skipped,
    //     skipReason: result.skipReason,
    //     executionTime: totalTime,
    //   };
    // }
  } catch (error) {
    console.error("[Processor] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
