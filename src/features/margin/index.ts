/**
 * Margin Feature Exports
 * 
 * Central export point for all margin-related functionality.
 */

// Hooks - Queries
export { useMarginAccountsQuery } from "./hooks/use-margin-accounts-query";

// Types
export type {
    GetMarginAccountsInput,
    GetMarginAccountInput,
    SyncMarginBalanceInput,
    MarginAccount,
    MarginAccountClient,
    MarginAccountWithExchange,
    GetMarginAccountsResult,
    GetMarginAccountResult,
    SyncMarginBalanceResult,
} from "./types/margin.types";

// Schemas (for advanced use cases)
export {
    GetMarginAccountsInputSchema,
    MarginAccountSchema,
    MarginAccountClientSchema,
    MarginAccountWithExchangeSchema,
} from "./schemas/margin.schema";

// Utility functions
export {
    calculateLiquidationRisk,
    calculateMaxSafeBorrow,
    estimateDailyInterest,
} from "./schemas/margin.schema";
