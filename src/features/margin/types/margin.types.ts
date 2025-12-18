/**
 * Margin Types
 * 
 * TypeScript types for Margin feature.
 * All types are re-exported from Zod schemas for single source of truth.
 */

export type {
    // Input types
    GetMarginAccountsInput,
    GetMarginAccountInput,
    SyncMarginBalanceInput,

    // Output types
    MarginAccount,
    MarginAccountClient,
    MarginAccountWithExchange,
    GetMarginAccountsResult,
    GetMarginAccountResult,
    SyncMarginBalanceResult,
} from "../schemas/margin.schema";
