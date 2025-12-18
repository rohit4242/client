/**
 * Portfolio Feature Exports
 * 
 * Central export point for all portfolio-related functionality.
 */

// Hooks - Queries
export { usePortfolioQuery } from "./hooks/use-portfolio-query";
export { usePortfolioStatsQuery } from "./hooks/use-portfolio-stats-query";
export { usePortfolioHistoryQuery } from "./hooks/use-portfolio-history-query";

// Hooks - Mutations
export { useSyncPortfolioBalanceMutation } from "./hooks/use-sync-portfolio-balance-mutation";

// Types
export type {
    SyncPortfolioBalanceInput,
    CalculatePortfolioStatsInput,
    GetPortfolioHistoryInput,
    PortfolioStats,
    Portfolio,
    PortfolioClient,
    BalanceSnapshot,
    BalanceSnapshotClient,
    ChartDataPoint,
    GetPortfolioResult,
    GetPortfolioStatsResult,
    GetPortfolioHistoryResult,
    SyncBalanceResult,
} from "./types/portfolio.types";

// Schemas (for advanced use cases)
export {
    SyncPortfolioBalanceInputSchema,
    CalculatePortfolioStatsInputSchema,
    GetPortfolioHistoryInputSchema,
    PortfolioStatsSchema,
    PortfolioSchema,
    PortfolioClientSchema,
    ChartDataPointSchema,
} from "./schemas/portfolio.schema";
