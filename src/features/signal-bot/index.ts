/**
 * Signal Bot Feature Exports
 * 
 * Central export point for all signal bot functionality.
 */

// Hooks - Queries
export { useBotsQuery } from "./hooks/use-bots-query";
export { useBotQuery } from "./hooks/use-bot-query";
export { useActiveBotsQuery } from "./hooks/use-active-bots-query";
export { useSignalsQuery } from "./hooks/use-signals-query";
export { useBotsStatsQuery } from "./hooks/use-bots-stats-query";

// Hooks - Mutations
export { useCreateBotMutation } from "./hooks/use-create-bot-mutation";
export { useUpdateBotMutation } from "./hooks/use-update-bot-mutation";
export { useDeleteBotMutation } from "./hooks/use-delete-bot-mutation";
export { useToggleBotMutation } from "./hooks/use-toggle-bot-mutation";
export { useUpdateSignalMutation } from "./hooks/use-update-signal-mutation";
export { useCreateBulkSignalsMutation } from "./hooks/use-create-bulk-signals-mutation";
export { useCreatePositionMutation } from "./hooks/use-create-position-mutation";
export { useCreateSignalMutation } from "./hooks/use-create-signal-mutation";
export { useDeleteSignalMutation } from "./hooks/use-delete-signal-mutation";
export { useTradeValidation } from "./hooks/use-trade-validation";

// Actions
export { getBots, getActiveBots } from "./actions/get-bots";
export { getBot } from "./actions/get-bot";
export { getBotsStats } from "./actions/get-bots-stats";
export { createBot } from "./actions/create-bot";
export { updateBot } from "./actions/update-bot";
export { deleteBot } from "./actions/delete-bot";
export { toggleBot } from "./actions/toggle-bot";
export { getSignals } from "./actions/get-signals";
export { updateSignal } from "./actions/update-signal";
export { createSignal } from "./actions/create-signal";
export { deleteSignal } from "./actions/delete-signal";
export { validateTrade } from "./actions/validate-trade";
export { createBulkSignals } from "./actions/create-bulk-signals";
export { createPosition } from "./actions/create-position";

// Constants
export * from "./constants/bot.constants";

// Types
export type {
    CreateBotInput,
    UpdateBotInput,
    DeleteBotInput,
    ToggleBotInput,
    CreateSignalInput,
    ProcessSignalInput,
    UploadSignalsCSVInput,
    GetBotsInput,
    GetSignalsInput,
    Bot,
    BotClient,
    BotWithExchange,
    Signal,
    SignalClient,
    GetBotsResult,
    GetBotResult,
    GetSignalsResult,
} from "./types/bot.types";

// Schemas (for advanced use cases)
export {
    CreateBotInputSchema,
    UpdateBotInputSchema,
    BotSchema,
    BotClientSchema,
    BotWithExchangeSchema,
    SignalSchema,
    SignalClientSchema,
} from "./schemas/bot.schema";

// Utility functions
export {
    parseAction,
    calculateMaxBorrow,
    calculateTradeAmount,
    validateBotCanTrade,
} from "./schemas/bot.schema";
