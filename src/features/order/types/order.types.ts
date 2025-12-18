/**
 * Order Types
 * 
 * TypeScript types for Order feature.
 * All types are re-exported from Zod schemas for single source of truth.
 */

export type {
    // Input types
    GetOrdersInput,
    GetOrderInput,

    // Output types
    Order,
    OrderClient,
    OrderWithPosition,
    GetOrdersResult,
    GetOrderResult,
} from "../schemas/order.schema";
