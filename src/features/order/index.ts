/**
 * Order Feature Exports
 * 
 * Central export point for all order-related functionality.
 */

// Hooks - Queries
export { useOrdersQuery } from "./hooks/use-orders-query";
export { useOrderQuery } from "./hooks/use-order-query";
export { usePositionOrdersQuery } from "./hooks/use-position-orders-query";

// Types
export type {
    GetOrdersInput,
    GetOrderInput,
    Order,
    OrderClient,
    OrderWithPosition,
    GetOrdersResult,
    GetOrderResult,
} from "./types/order.types";

// Schemas (for advanced use cases)
export {
    GetOrdersInputSchema,
    GetOrderInputSchema,
    OrderSchema,
    OrderClientSchema,
    OrderWithPositionSchema,
} from "./schemas/order.schema";
