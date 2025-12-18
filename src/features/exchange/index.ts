/**
 * Exchange Feature Exports
 * 
 * Central export point for all exchange-related functionality.
 */

// Hooks - Queries
export { useExchangesQuery } from "./hooks/use-exchanges-query";
export { useExchangeQuery } from "./hooks/use-exchange-query";

// Hooks - Mutations
export { useCreateExchangeMutation } from "./hooks/use-create-exchange-mutation";
export { useUpdateExchangeMutation } from "./hooks/use-update-exchange-mutation";
export { useDeleteExchangeMutation } from "./hooks/use-delete-exchange-mutation";
export { useSyncExchangeMutation } from "./hooks/use-sync-exchange-mutation";

// Types
export type {
    CreateExchangeInput,
    UpdateExchangeInput,
    DeleteExchangeInput,
    SyncExchangeInput,
    Exchange,
    ExchangeClient,
    GetExchangesResult,
    GetExchangeResult,
    SyncExchangeResult,
} from "./types/exchange.types";

// Schemas (for advanced use cases)
export {
    CreateExchangeInputSchema,
    UpdateExchangeInputSchema,
    DeleteExchangeInputSchema,
    SyncExchangeInputSchema,
    ExchangeSchema,
    ExchangeClientSchema,
} from "./schemas/exchange.schema";
