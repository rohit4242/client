/**
 * Standardized Error Handling for Server Actions
 * 
 * Provides consistent error handling across all server actions with
 * proper error classification and user-friendly messages.
 */

import { ZodError } from "zod";
import { Prisma } from "@prisma/client";

/**
 * Standard server action result type
 */
export type ServerActionResult<T = unknown> =
    | { success: true; data: T }
    | { success: false; error: string; details?: unknown };

/**
 * Handle server action errors with proper error classification
 * 
 * @param error - The error to handle
 * @param fallbackMessage - Default message if error type is unknown
 * @returns Standardized error result
 * 
 * @example
 * try {
 *   // ... server action logic
 *   return { success: true, data: result };
 * } catch (error) {
 *   return handleServerError(error, "Failed to perform action");
 * }
 */
export function handleServerError(
    error: unknown,
    fallbackMessage: string
): ServerActionResult<never> {
    // Log error for debugging (in development)
    if (process.env.NODE_ENV === "development") {
        console.error("Server Action Error:", error);
    }

    // Zod validation errors
    if (error instanceof ZodError) {
        const firstError = error.issues[0];
        return {
            success: false,
            error: firstError?.message || "Validation failed",
            details: error.message,
        };
    }

    // Prisma errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        switch (error.code) {
            case "P2002":
                // Unique constraint violation
                const target = error.meta?.target as string[] | undefined;
                const field = target?.[0] || "field";
                return {
                    success: false,
                    error: `A record with this ${field} already exists`,
                };
            case "P2025":
                // Record not found
                return {
                    success: false,
                    error: "Record not found",
                };
            case "P2003":
                // Foreign key constraint violation
                return {
                    success: false,
                    error: "Cannot perform this operation due to related records",
                };
            case "P2014":
                // Required relation violation
                return {
                    success: false,
                    error: "Required relation is missing",
                };
            default:
                return {
                    success: false,
                    error: `Database error: ${error.code}`,
                };
        }
    }

    // Prisma validation errors
    if (error instanceof Prisma.PrismaClientValidationError) {
        return {
            success: false,
            error: "Invalid data provided to database",
        };
    }

    // Standard errors
    if (error instanceof Error) {
        return {
            success: false,
            error: error.message,
        };
    }

    // Unknown errors
    return {
        success: false,
        error: fallbackMessage,
    };
}

/**
 * Create a success result
 * 
 * @param data - The data to return
 * @returns Success result
 * 
 * @example
 * return successResult(exchange);
 */
export function successResult<T>(data: T): ServerActionResult<T> {
    return { success: true, data };
}

/**
 * Create an error result
 * 
 * @param error - Error message
 * @param details - Optional error details
 * @returns Error result
 * 
 * @example
 * return errorResult("Exchange not found");
 */
export function errorResult(error: string, details?: unknown): ServerActionResult<never> {
    return { success: false, error, details };
}

/**
 * Assert that a value exists (not null/undefined)
 * Throws an error with a custom message if the value is null/undefined
 * 
 * @param value - Value to check
 * @param message - Error message if value is null/undefined
 * @throws Error if value is null/undefined
 * 
 * @example
 * const user = await getUser();
 * assertExists(user, "User not found");
 */
export function assertExists<T>(
    value: T | null | undefined,
    message: string
): asserts value is T {
    if (value === null || value === undefined) {
        throw new Error(message);
    }
}

/**
 * Authorization check helper
 * 
 * @param condition - Authorization condition
 * @param message - Error message if unauthorized
 * @throws Error if condition is false
 * 
 * @example
 * assertAuthorized(session.user.role === "ADMIN", "Admin access required");
 */
export function assertAuthorized(
    condition: boolean,
    message: string = "Unauthorized"
): asserts condition {
    if (!condition) {
        throw new Error(message);
    }
}
