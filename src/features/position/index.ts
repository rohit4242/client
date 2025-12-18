/**
 * Position Feature Exports
 * 
 * Central export point for all position-related functionality.
 */

// Hooks - Queries
export { usePositionsQuery } from "./hooks/use-positions-query";
export { usePositionQuery } from "./hooks/use-position-query";
export { useOpenPositionsQuery } from "./hooks/use-open-positions-query";
export { useClosedPositionsQuery } from "./hooks/use-closed-positions-query";

// Hooks - Mutations
export { useClosePositionMutation } from "./hooks/use-close-position-mutation";
export { useForceCloseAllMutation } from "./hooks/use-force-close-all-mutation";

// Types
export type {
    GetPositionsInput,
    GetPositionInput,
    ClosePositionInput,
    UpdateStopLossTakeProfitInput,
    ForceCloseAllInput,
    Position,
    PositionClient,
    PositionWithRelations,
    GetPositionsResult,
    GetPositionResult,
    ClosePositionResult,
    UpdateStopLossTakeProfitResult,
    ForceCloseAllResult,
} from "./types/position.types";

export * from "./types/ui.types";

// Schemas (for advanced use cases)
export {
    GetPositionsInputSchema,
    GetPositionInputSchema,
    PositionSchema,
    PositionClientSchema,
    PositionWithRelationsSchema,
} from "./schemas/position.schema";
