/**
 * Signal Bot Types
 * 
 * TypeScript types for Signal Bot feature.
 * All types are re-exported from Zod schemas for single source of truth.
 */

export type {
    // Input types
    CreateBotInput,
    UpdateBotInput,
    DeleteBotInput,
    ToggleBotInput,
    CreateSignalInput,
    ProcessSignalInput,
    UploadSignalsCSVInput,
    GetBotsInput,
    GetSignalsInput,

    // Output types
    Bot,
    BotClient,
    BotWithExchange,
    Signal,
    SignalClient,
    GetBotsResult,
    GetBotResult,
    GetSignalsResult,
} from "../schemas/bot.schema";
