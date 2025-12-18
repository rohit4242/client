/**
 * Position Types
 * 
 * TypeScript types for Position feature.
 * All types are re-exported from Zod schemas for single source of truth.
 */

export type {
    // Input types
    GetPositionsInput,
    GetPositionInput,
    ClosePositionInput,
    UpdateStopLossTakeProfitInput,
    ForceCloseAllInput,

    // Output types
    Position,
    PositionClient,
    PositionWithRelations,
    GetPositionsResult,
    GetPositionResult,
    ClosePositionResult,
    UpdateStopLossTakeProfitResult,
    ForceCloseAllResult,
} from "../schemas/position.schema";
